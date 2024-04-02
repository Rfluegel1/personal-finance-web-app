import {randomUUID} from 'node:crypto'
import PlaidService from '../../src/plaid/PlaidService'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import Bank from '../../src/banks/Bank'

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
        accountsGet: jest.fn()
    }
}))

jest.mock('../../src/banks/BankService', () => {
    return jest.fn().mockImplementation(() => {
        return {
            createBank: jest.fn(),
            getBanksByOwner: jest.fn(),
            getBank: jest.fn()
        }
    })
})

describe('Plaid service', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Resets call counts but keeps the mock implementation
    });

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
                'products': ['transactions']
            })
            expect(result).toEqual({link_token: mockedLinkToken})
        })

        test('should call to plaid to exchange public token for access token and to bank', async () => {
            // given
            let mockedAccessToken = randomUUID()
            let mockedBankId = randomUUID();
            (plaidClient.itemPublicTokenExchange as jest.Mock).mockImplementation((param: any) => {
                if (param.public_token === 'public_token') {
                    return {data: {access_token: mockedAccessToken}}
                }
            });
            (plaidService.bankService.createBank as jest.Mock).mockImplementation((accessToken: any, owner: any) => {
                if (accessToken === mockedAccessToken && owner === 'user') {
                    const bank = new Bank(accessToken, owner)
                    bank.id = mockedBankId
                    return bank
                }
            });

            // when
            const result = await plaidService.exchangeTokenAndSaveBank('public_token', 'user')

            // then
            expect(result).toEqual({bankId: mockedBankId})
        })

        test('should call to plaid to get bank names', async () => {
            // given
            let userId = 'user'
            let firstMockedBank = new Bank('access_token1', userId);
            let secondMockedBank = new Bank('access_token2', userId);
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockImplementation((owner) => {
                if (owner === userId) {
                    return [firstMockedBank, secondMockedBank]
                }
            });
            (plaidClient.accountsGet as jest.Mock).mockImplementation((params: any) => {
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
                    return {data: {institution: {name: 'bankName1'}}}
                }
                if (params.institution_id === 'bankId2' && params.country_codes[0] === 'US') {
                    return {data: {institution: {name: 'bankName2'}}}
                }
            });
            (plaidClient.transactionsGet as jest.Mock).mockImplementation((params: any) => {
                if (params.access_token === firstMockedBank.accessToken && params.start_date === '2022-01-01' && params.end_date === '2023-01-01') {
                    return {
                        data: {
                            item: {institution_id: 'bankId1'},
                            transactions: [
                                {amount: 1},
                                {amount: 1},
                                {amount: 2},
                                {amount: 2}
                            ],
                            accounts: [
                                {
                                    name: 'bank1AccountName1'
                                }, {
                                    name: 'bank1AccountName2'
                                }
                            ],
                        }
                    }
                }
                if (params.access_token === secondMockedBank.accessToken && params.start_date === '2022-01-01' && params.end_date === '2023-01-01') {
                    return {
                        data: {
                            item: {institution_id: 'bankId2'},
                            transactions: [
                                {amount: 3},
                                {amount: 3},
                                {amount: 4},
                                {amount: 4}
                            ],
                            accounts: [
                                {
                                    name: 'bank2AccountName1'
                                }, {
                                    name: 'bank2AccountName2'
                                }
                            ],
                        }
                    }
                }
            });

            // when
            const response = await plaidService.getOverview(userId)

            // then
            expect(response).toEqual([
                {
                    name: 'bankName1',
                    accounts: [
                        {name: 'bank1AccountName1'},
                        {name: 'bank1AccountName2'}
                    ],
                    transactions: [
                        {amount: 1},
                        {amount: 1},
                        {amount: 2},
                        {amount: 2}
                    ]
                },
                {
                    name: 'bankName2',
                    accounts: [
                        {name: 'bank2AccountName1'},
                        {name: 'bank2AccountName2'}
                    ],
                    transactions: [
                        {amount: 3},
                        {amount: 3},
                        {amount: 4},
                        {amount: 4}
                    ]
                },
            ])
        })

        test('should call transactions get more than once when bad request message is PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockRejectedValueOnce({response: {data: {error_code: 'PRODUCT_NOT_READY'}}});
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: [{amount: 1}]}});

            // when
            await plaidService.getTransactionsResponse(firstMockedBank)

            // then
            expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2);
        })

        test('should call transactions get more than once when transactions length is 0', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: []}});
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: [{amount: 1}]}});

            // when
            await plaidService.getTransactionsResponse(firstMockedBank)

            // then
            expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2);
        })

        test('should throw error when bad request message is not PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockRejectedValue({response: 'SOME_OTHER_ERROR'})

            try {
                // when
                await plaidService.getTransactionsResponse(firstMockedBank)
            } catch (error: any) {
                // then
                expect(error.response).toEqual('SOME_OTHER_ERROR')
            }
        })
    })
})