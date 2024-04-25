import {randomUUID} from 'node:crypto'
import PlaidService from '../../src/plaid/PlaidService'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import Bank from '../../src/banks/Bank'
import {getTodaysDateInYYYYMMDD, getTwoYearsPreviousTodaysDateInYYYYMMDD} from '../../src/utils'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        }
    })
}))

jest.mock('../../src/plaid/PlaidConfiguration', () => ({
    plaidClient: {
        transactionsGet: jest.fn(),
        linkTokenCreate: jest.fn(),
        itemPublicTokenExchange: jest.fn(),
        institutionsGetById: jest.fn(),
        accountsGet: jest.fn(),
        investmentsTransactionsGet: jest.fn(),
        itemGet: jest.fn()
    }
}))

jest.mock('../../src/banks/BankService', () => {
    return jest.fn().mockImplementation(() => {
        return {
            createBank: jest.fn(),
            getBanksByOwner: jest.fn(),
            getBank: jest.fn(),
            getBankByItemId: jest.fn(),
            updateBank: jest.fn()
        }
    })
})

describe('Plaid service', () => {
    beforeEach(() => {
        jest.clearAllMocks() // Resets call counts but keeps the mock implementation
    })

    const plaidService = new PlaidService()
    describe('in regards to normal operation', () => {
        test('should call to plaid and return link token', async () => {
            // given
            let mockedLinkToken = randomUUID();
            (plaidClient.linkTokenCreate as jest.Mock).mockResolvedValue({data: {link_token: mockedLinkToken}})
            let userId = 'user'

            // when
            const result = await plaidService.createLinkToken(userId)

            // then
            expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
                'client_name': 'personal-finance-web-app',
                'country_codes': ['US'],
                'language': 'en',
                'user': {
                    'client_user_id': userId
                },
                'products': ['transactions'],
                'required_if_supported_products': ['investments', 'liabilities']
            })
            expect(result).toEqual({link_token: mockedLinkToken})
        })
        test('should call to plaid and return update link token', async () => {
            // given
            let mockedLinkToken = randomUUID();
            (plaidClient.linkTokenCreate as jest.Mock).mockResolvedValue({data: {link_token: mockedLinkToken}})

            let userId = 'user';
            (plaidService.bankService.getBankByItemId as jest.Mock).mockImplementation((itemId) => {
                if (itemId === 'itemId') {
                    return {accessToken: 'accessToken'}
                }
            })

            // when
            const result = await plaidService.createUpdateLinkToken(userId, 'itemId')

            // then
            expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
                'client_name': 'personal-finance-web-app',
                'country_codes': ['US'],
                'language': 'en',
                'access_token': 'accessToken',
                'user': {
                    'client_user_id': userId
                },
                'products': ['transactions'],
                'required_if_supported_products': ['investments', 'liabilities']
            })
            expect(result).toEqual({link_token: mockedLinkToken})
        })
        test('should call to plaid to exchange public token for access token and to bank', async () => {
            // given
            let mockedAccessToken = randomUUID()
            let mockedBankId = randomUUID()
            let mockedItemId = randomUUID();
            (plaidClient.itemPublicTokenExchange as jest.Mock).mockImplementation((param: any) => {
                if (param.public_token === 'public_token') {
                    return {data: {access_token: mockedAccessToken, item_id: mockedItemId}}
                }
            });
            (plaidService.bankService.createBank as jest.Mock).mockImplementation((accessToken: any, owner: any, itemId) => {
                if (accessToken === mockedAccessToken && owner === 'user' && mockedItemId === itemId) {
                    const bank = new Bank(accessToken, owner)
                    bank.id = mockedBankId
                    return bank
                }
            })

            // when
            const result = await plaidService.exchangeTokenAndSaveBank('public_token', 'user')

            // then
            expect(result).toEqual({bankId: mockedBankId})
        })
        test('should call to plaid to exchange public token for access token and update bank', async () => {
            // given
            let mockedAccessToken = randomUUID()
            let mockedItemId = randomUUID();
            (plaidClient.itemPublicTokenExchange as jest.Mock).mockImplementation((param: any) => {
                if (param.public_token === 'public_token') {
                    return {data: {access_token: mockedAccessToken, item_id: mockedItemId}}
                }
            });
            (plaidService.bankService.updateBank as jest.Mock).mockImplementation((accessToken: any, bankId) => {
                if (accessToken === mockedAccessToken && bankId === 'bankId') {
                    const bank = new Bank(accessToken)
                    bank.id = 'bankId'
                    return bank
                }
            })

            // when
            const result = await plaidService.exchangeTokenAndUpdateBank('public_token', 'bankId')

            // then
            expect(result).toEqual({bankId: 'bankId'})
        })

        test('should call to plaid to get bank names, account names, and associated transactions', async () => {
            // given
            let userId = 'user'
            const firstBankId = randomUUID()
            let firstMockedBank = new Bank('access_token1', userId, '1234')
            firstMockedBank.id = firstBankId
            const secondBankId = randomUUID()
            let secondMockedBank = new Bank('access_token2', userId, '5678')
            secondMockedBank.id = secondBankId;
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockImplementation((owner) => {
                if (owner === userId) {
                    return [firstMockedBank, secondMockedBank]
                }
            });
            (plaidClient.itemGet as jest.Mock).mockImplementation((params: any) => {
                if (params.access_token === firstMockedBank.accessToken) {
                    return {
                        data: {
                            item: {institution_id: 'bankId1'}
                        }
                    }
                }
                if (params.access_token === secondMockedBank.accessToken) {
                    return {
                        data: {
                            item: {institution_id: 'bankId2'}
                        }
                    }
                }
            });
            (plaidClient.institutionsGetById as jest.Mock).mockImplementation((params: any) => {
                if (params.institution_id === 'bankId1' && params.country_codes[0] === 'US') {
                    return {
                        data: {
                            institution: {name: 'bankName1', products: ['transactions']}
                        }
                    }
                }
                if (params.institution_id === 'bankId2' && params.country_codes[0] === 'US') {
                    return {
                        data: {
                            institution: {name: 'bankName2', products: ['investments']}
                        }
                    }
                }
            });
            (plaidClient.transactionsGet as jest.Mock).mockImplementation((params: any) => {
                if (params.access_token === firstMockedBank.accessToken
                    && params.start_date === getTwoYearsPreviousTodaysDateInYYYYMMDD()
                    && params.end_date === getTodaysDateInYYYYMMDD()) {
                    return {
                        data: {
                            item: {institution_id: 'bankId1'},
                            transactions: [
                                {amount: 2, date: '2001-02-02', account_id: 'accountId1'},
                                {amount: 1, date: '2000-01-01', account_id: 'accountId2'},
                                {amount: 4, date: '2002-03-03', account_id: 'accountId1'},
                                {amount: 3, date: '2001-02-02', account_id: 'accountId2'}
                            ],
                            total_transactions: 4,
                            accounts: [
                                {
                                    account_id: 'accountId1',
                                    name: 'bank1AccountName1',
                                    type: 'depository', balances: {current: 100}
                                }, {
                                    account_id: 'accountId2',
                                    name: 'bank1AccountName2',
                                    type: 'credit', balances: {current: 200}
                                }
                            ],
                        }
                    }
                }
                if (params.access_token === secondMockedBank.accessToken
                    && params.start_date === getTwoYearsPreviousTodaysDateInYYYYMMDD()
                    && params.end_date === getTodaysDateInYYYYMMDD()) {
                    return {
                        data: {
                            item: {institution_id: 'bankId2'},
                            transactions: [
                                {amount: 6, date: '2003-04-04', account_id: 'accountId3'},
                                {amount: 8, date: '2004-05-05', account_id: 'accountId3'},
                            ],
                            total_transactions: 2,
                            accounts: [
                                {
                                    account_id: 'accountId3',
                                    name: 'bank2AccountName1',
                                    type: 'loan', balances: {current: 300}
                                }, {
                                    account_id: 'accountId4',
                                    name: 'bank2AccountName2',
                                    type: 'investment', balances: {current: 400}
                                }
                            ],
                        }
                    }
                }
            });

            (plaidClient.investmentsTransactionsGet as jest.Mock).mockImplementation((params: any) => {
                if (params.access_token === secondMockedBank.accessToken
                    && params.start_date === getTwoYearsPreviousTodaysDateInYYYYMMDD()
                    && params.end_date === getTodaysDateInYYYYMMDD()) {
                    return {
                        data: {
                            item: {institution_id: 'bankId2'},
                            investment_transactions: [
                                {amount: 5, date: '2002-03-03', account_id: 'accountId4'},
                                {amount: 7, date: '2003-04-04', account_id: 'accountId4'},
                            ],
                            total_transactions: 2,
                            accounts: [
                                {
                                    account_id: 'accountId3',
                                    name: 'bank2AccountName1',
                                    type: 'loan', balances: {current: 300}
                                }, {
                                    account_id: 'accountId4',
                                    name: 'bank2AccountName2',
                                    type: 'investment', balances: {current: 400}
                                }
                            ],
                        }
                    }
                }
            })

            // when
            const response = await plaidService.getOverview(userId)

            // then
            expect(response).toEqual({
                banks: [
                    {
                        name: 'bankName1',
                        id: firstBankId,
                        itemId: '1234',
                        accounts: [
                            {
                                name: 'bank1AccountName1',
                                type: 'depository',
                                balances: {current: 100},
                                transactions: [{amount: 2, date: '2001-02-02'}, {amount: 4, date: '2002-03-03'}]
                            },
                            {
                                name: 'bank1AccountName2',
                                type: 'credit',
                                balances: {current: 200},
                                transactions: [{amount: 1, date: '2000-01-01'}, {amount: 3, date: '2001-02-02'}]
                            }
                        ]
                    },
                    {
                        name: 'bankName2',
                        itemId: '5678',
                        id: secondBankId,
                        accounts: [
                            {
                                name: 'bank2AccountName1',
                                type: 'loan',
                                balances: {current: 300},
                                transactions: [{amount: 6, date: '2003-04-04'}, {amount: 8, date: '2004-05-05'}]
                            },
                            {
                                name: 'bank2AccountName2',
                                type: 'investment',
                                balances: {current: 400},
                                transactions: [{amount: 5, date: '2002-03-03'}, {amount: 7, date: '2003-04-04'}]
                            }
                        ]
                    },
                ],
                netWorths: [
                    {date: '2000-01-01', value: 0, epochTimestamp: 946684800000},
                    {date: '2001-02-02', value: 1, epochTimestamp: 981072000000},
                    {date: '2002-03-03', value: 2, epochTimestamp: 1015113600000},
                    {date: '2003-04-04', value: -7, epochTimestamp: 1049414400000},
                    {date: '2004-05-05', value: -8, epochTimestamp: 1083715200000},
                    {
                        date: getTodaysDateInYYYYMMDD(),
                        value: 0,
                        epochTimestamp: new Date(getTodaysDateInYYYYMMDD() + 'T00:00:00Z').getTime()
                    }
                ]
            })
        })

        test('should call transactions get more than once when bad request message is PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockRejectedValueOnce({response: {data: {error_code: 'PRODUCT_NOT_READY'}}});
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: [{amount: 1}]}})

            // when
            await plaidService.getTransactionsResponseWithRetry(firstMockedBank)

            // then
            expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2)
        })
        test('should throw error when bad request message is not PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockRejectedValue({response: 'SOME_OTHER_ERROR'})

            try {
                // when
                await plaidService.getTransactionsResponseWithRetry(firstMockedBank)
            } catch (error: any) {
                // then
                expect(error.response).toEqual('SOME_OTHER_ERROR')
            }
        })
        test('should paginate transactions when transactions length is less than total transactions', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockResolvedValue([firstMockedBank]);
            (plaidClient.transactionsGet as jest.Mock).mockImplementation((params) => {
                if (params.options.offset === 1) {
                    return {
                        data: {
                            transactions: [{amount: 2}],
                            total_transactions: 2
                        },
                    }
                }
            });
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({
                data: {
                    transactions: [{amount: 1}],
                    total_transactions: 2,
                    item: {institution_id: 'bankId1'},
                    accounts: [{name: 'bank1AccountName1', balances: {current: 1}}]
                },
            });
            (plaidClient.institutionsGetById as jest.Mock).mockResolvedValue({
                data: {
                    institution: {
                        name: 'bankName1',
                        products: []
                    }
                }
            })

            // when
            const result = await plaidService.getOverview('userId')

            // then
            expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2)
            expect(result.banks[0].accounts[0].transactions).toEqual([{amount: 1}, {amount: 2}])
        })

        test('should call investment transactions get more than once when bad request message is PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.investmentsTransactionsGet as jest.Mock).mockRejectedValueOnce({response: {data: {error_code: 'PRODUCT_NOT_READY'}}});
            (plaidClient.investmentsTransactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: [{amount: 1}]}})

            // when
            await plaidService.getInvestmentTransactionsResponseWithRetry(firstMockedBank)

            // then
            expect(plaidClient.investmentsTransactionsGet).toHaveBeenCalledTimes(2)
        })
        test('should throw error when bad request message is not PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.investmentsTransactionsGet as jest.Mock).mockRejectedValue({response: 'SOME_OTHER_ERROR'})

            try {
                // when
                await plaidService.getInvestmentTransactionsResponseWithRetry(firstMockedBank)
            } catch (error: any) {
                // then
                expect(error.response).toEqual('SOME_OTHER_ERROR')
            }
        })
        test('should paginate transactions when investment transactions length is less than total investment transactions', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockResolvedValue([firstMockedBank]);
            (plaidClient.investmentsTransactionsGet as jest.Mock).mockImplementation((params) => {
                if (params.options.offset === 1) {
                    return {
                        data: {
                            investment_transactions: [{amount: 2}],
                            total_investment_transactions: 2
                        },
                    }
                }
            });
            (plaidClient.investmentsTransactionsGet as jest.Mock).mockResolvedValueOnce({
                data: {
                    investment_transactions: [{amount: 1}],
                    total_investment_transactions: 2,
                    item: {institution_id: 'bankId1'},
                },
            });
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValue({
                data: {
                    transactions: [{amount: 1}],
                    total_transactions: 1,
                    item: {institution_id: 'bankId1'},
                    accounts: [{name: 'bank1AccountName1', balances: {current: 1}}]
                }
            });
            (plaidClient.itemGet as jest.Mock).mockResolvedValue({
                data: {
                    item: {
                        institution_id: 'ins_1'
                    }
                }
            });
            (plaidClient.institutionsGetById as jest.Mock).mockResolvedValue({
                data: {
                    institution: {
                        name: 'bankName1',
                        products: ['investments']
                    }
                }
            })

            // when
            const result = await plaidService.getOverview('userId')

            // then
            expect(plaidClient.investmentsTransactionsGet).toHaveBeenCalledTimes(2)
            expect(result.banks[0].accounts[0].transactions).toEqual([{amount: 1}, {amount: 1}, {amount: 2}])
        })

        test('should return notice that item login required was experienced', async () => {
            // given
            let userId = 'user'
            let firstMockedBank = new Bank('access_token1', userId, '1234');
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockImplementation((owner) => {
                if (owner === userId) {
                    return [firstMockedBank]
                }
            });
            (plaidClient.itemGet as jest.Mock).mockImplementation((params: any) => {
                if (params.access_token === firstMockedBank.accessToken) {
                    return {
                        data: {
                            item: {institution_id: 'bankId1'}
                        }
                    }
                }
            });
            (plaidClient.institutionsGetById as jest.Mock).mockImplementation((params: any) => {
                if (params.institution_id === 'bankId1' && params.country_codes[0] === 'US') {
                    return {
                        data: {
                            institution: {name: 'bankName1', products: ['investments']}
                        }
                    }
                }
            });
            (plaidClient.transactionsGet as jest.Mock).mockRejectedValueOnce({response: {data: {error_code: 'ITEM_LOGIN_REQUIRED'}}})

            // when
            const response = await plaidService.getOverview(userId)

            // then
            expect(response).toEqual({
                banks: [{
                    name: 'bankName1',
                    itemId: '1234',
                    id: firstMockedBank.id,
                    accounts: [],
                    error: 'ITEM_LOGIN_REQUIRED'
                }],
                netWorths: []
            })
        })

        test('should return no net worths when there are no banks', async () => {
            // given
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockResolvedValue([])

            // when
            const result = await plaidService.getOverview('userId')

            // then
            expect(result.netWorths.length).toEqual(0)
        })
    })
})