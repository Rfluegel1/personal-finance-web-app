<script>
    import {onMount} from 'svelte';
    import axios from 'axios';
    import drawChart from "$lib/drawGraph.js";
    import HamburgerMenu from "$lib/HamburgerMenu.svelte";
    import CategorySummary from "$lib/CategorySummary.svelte";
    import AccountDetails from "$lib/AccountDetails.svelte";
    import { formatCurrency } from '$lib/formatters';

    let isEmailVerified = false;
    let error = '';
    let banks = [];
    let link_token = '';
    let handler;
    let netWorths = [];
    let visibility = {}
    let isLoading = false;
    let bankHandlers = {}
    let links = [
        {url: '/logout', label: 'Logout'},
        {url: '/email-change', label: 'Change Email'},
        {url: '/password-reset-request', label: 'Change Password'}
    ];
    let cashAccounts = []
    let investmentAccounts = []
    let creditAccounts = []
    let loanAccounts = []

    onMount(async () => {
        try {
            isEmailVerified = (await axios.get('/api/users/is-verified')).data.isVerified;
        } catch (e) {
            error = 'Failed to verify user'
        }
        if (isEmailVerified) {
            try {
                isLoading = true;
                await axios.get('/api/overview').then(response => {
                    banks = response.data.banks
                    netWorths = response.data.netWorths
                })
            } catch (e) {
                error = 'Failed to get overview'
            } finally {
                isLoading = false;
            }
            drawChart(netWorths);
        }
    });


    function createUpdateLinksForErrorBanks(banks) {
        banks.forEach(bank => {
            if (bank.error === 'ITEM_LOGIN_REQUIRED') {
                createUpdateLinkToken(bank);
            }
        });

    }

    onMount(async () => {
        try {
            const linkTokenResponse = await axios.post('/api/create_link_token')
            link_token = linkTokenResponse.data.link_token
            initializePlaid();
            createUpdateLinksForErrorBanks(banks)
        } catch (e) {
            error = 'Failed to create link token'
        }
    });

    onMount(() => {
        separateAssetsAndLiabilities();
    });

    function separateAssetsAndLiabilities() {
        banks.forEach(bank => {
            bank.accounts.forEach(account => {
                if (['depository'].includes(account.type)) {
                    cashAccounts.push(account)
                } else if (['investment'].includes(account.type)) {
                    investmentAccounts.push(account)
                } else if (['credit'].includes(account.type)) {
                    creditAccounts.push(account)
                } else if (['loan'].includes(account.type)) {
                    loanAccounts.push(account)
                }
            })
        })
        creditAccounts = creditAccounts
        loanAccounts = loanAccounts
        cashAccounts = cashAccounts
        investmentAccounts = investmentAccounts
    }

    $: banks, separateAssetsAndLiabilities(banks);

    $: banks, createUpdateLinksForErrorBanks(banks);

    $: netWorths, drawChart(netWorths);

    function initializePlaid() {
        handler = Plaid.create({
            token: link_token,
            onSuccess: async (public_token, metadata) => {
                try {
                    isLoading = true;
                    await axios.post('/api/exchange_token_and_save_bank', {public_token})
                } catch (e) {
                    error = 'Failed to save bank'
                } finally {
                    isLoading = false;
                }
                try {
                    isLoading = true;
                    await axios.get('/api/overview').then(response => {
                        banks = response.data.banks
                        netWorths = response.data.netWorths
                    })
                } catch (e) {
                    error = 'Failed to get overview'
                } finally {
                    isLoading = false;
                }
            }
        });
    }

    function initializeUpdatePlaid(bankName) {
        bankHandlers[bankName].handler = Plaid.create({
            token: bankHandlers[bankName].link_token,
            onSuccess: async (public_token, metadata) => {
                try {
                    isLoading = true;
                    await axios.get('/api/overview').then(response => {
                        banks = response.data.banks
                        netWorths = response.data.netWorths
                    })
                } catch (e) {
                    error = 'Failed to get overview'
                } finally {
                    isLoading = false;
                }
            },
        });
    }

    function toggleVisibility(name) {
        visibility[name] = !visibility[name]
    }

    async function createUpdateLinkToken(bank) {
        try {
            let response = await axios.post('/api/create_update_link_token', {itemId: bank.itemId})
            bankHandlers[bank.name] = {link_token: response.data.link_token, handler: null}
            initializeUpdatePlaid(bank.name)
        } catch (e) {
            error = 'Failed to create update link token'
        }
    }

    function filterData(range) {
        const now = new Date();
        let filteredData;

        switch (range) {
            case '1M':
                let date = new Date(now.setMonth(now.getMonth() - 1));
                filteredData = netWorths.filter(d => new Date(d.date) >= date);
                break;
            case '3M':
                let date1 = new Date(now.setMonth(now.getMonth() - 3));
                filteredData = netWorths.filter(d => new Date(d.date) >= date1);
                break;
            case '6M':
                let date2 = new Date(now.setMonth(now.getMonth() - 6));
                filteredData = netWorths.filter(d => new Date(d.date) >= date2);
                break;
            case 'YTD':
                filteredData = netWorths.filter(d => new Date(d.date) >= new Date(now.getFullYear(), 0, 1));
                break;
            case '1Y':
                let date3 = new Date(now.setFullYear(now.getFullYear() - 1));
                filteredData = netWorths.filter(d => new Date(d.date) >= date3);
                break;
            case '2Y':
                filteredData = netWorths
                break;
        }
        drawChart(filteredData);
    }
</script>

<svelte:head>
    <script
            src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
    ></script>
</svelte:head>

<header class="top-header">
    <HamburgerMenu {links}/>
</header>

<main>
    <h1>Net Worth</h1>
    {#if error}
        <div class='error' role='alert'>{error}</div>
    {/if}
    {#if isEmailVerified}
        {#if netWorths.length > 0}
            <h2 style="font-weight: 700; font-size: 3.1875rem;">{formatCurrency(netWorths[netWorths.length - 1].value)}</h2>
        {/if}
        <div id="chart-container">
            <svg id="chart"></svg>
            <div class="button-container">
                <button class="range-button" id="1M" on:click={() => filterData('1M')}>1M</button>
                <button class="range-button" id="3M" on:click={() => filterData('3M')}>3M</button>
                <button class="range-button" id="6M" on:click={() => filterData('6M')}>6M</button>
                <button class="range-button" id="YTD" on:click={() => filterData('YTD')}>YTD</button>
                <button class="range-button" id="1Y" on:click={() => filterData('1Y')}>1Y</button>
                <button class="range-button" id="2Y" on:click={() => filterData('2Y')}>2Y</button>
            </div>
        </div>
        <div class="grey-bar"></div>
        {#if isLoading}
            <div>Loading...</div>
        {/if}

        {#if banks.some(bank => bank.error === 'ITEM_LOGIN_REQUIRED')}
            {#each banks as bank}
                {#if bank.error === 'ITEM_LOGIN_REQUIRED'}
                    <h2>{bank.name}</h2>
                    <div class='error' role='alert'>{bank.error}</div>
                    <button id={`${bank.name}-login-button`}
                            on:click={bankHandlers[bank.name]?.handler.open()}
                            disabled={!bankHandlers[bank.name]?.handler}>
                        Authenticate Bank
                    </button>
                {/if}
            {/each}
        {:else}
            <button id='add-bank' on:click={handler.open()} disabled={!link_token || isLoading}>Add Bank</button>
            <div class="asset-list">
                <h2>Assets</h2>
                <p>{formatCurrency(cashAccounts.concat(investmentAccounts).reduce((accumulator, asset) => accumulator + asset.balances.current, 0))}</p>
                <CategorySummary
                        title="Cash"
                        accountCount={cashAccounts.length}
                        totalBalance={formatCurrency(cashAccounts.reduce((total, account) => total + account.balances.current, 0))}
                        onClick={() => toggleVisibility('cash')}
                />
                {#if visibility['cash']}
                    <ul>
                        {#each cashAccounts as account}
                            <AccountDetails {account} toggleVisibility={toggleVisibility} isVisible={visibility[account.name]}/>
                        {/each}
                    </ul>
                {/if}
                <div class="tiny-grey-bar"></div>
                <CategorySummary
                        title="Investment"
                        accountCount={investmentAccounts.length}
                        totalBalance={formatCurrency(investmentAccounts.reduce((total, account) => total + account.balances.current, 0))}
                        onClick={() => toggleVisibility('investment')}
                />
                {#if visibility['investment']}
                    <ul>
                        {#each investmentAccounts as account}
                            <AccountDetails {account} toggleVisibility={toggleVisibility} isVisible={visibility[account.name]}/>
                        {/each}
                    </ul>
                {/if}
            </div>

            <div class="grey-bar"></div>

            <div class="asset-list">
                <h2>Liabilities</h2>
                <p>{formatCurrency(creditAccounts.concat(loanAccounts).reduce((accumulator, asset) => accumulator + asset.balances.current, 0))}</p>
                <CategorySummary
                        title="Credit"
                        accountCount={creditAccounts.length}
                        totalBalance={formatCurrency(creditAccounts.reduce((total, account) => total + account.balances.current, 0))}
                        onClick={() => toggleVisibility('credit')}
                />
                {#if visibility['credit']}
                    <ul>
                        {#each creditAccounts as account}
                            <AccountDetails {account} toggleVisibility={toggleVisibility} isVisible={visibility[account.name]}/>
                        {/each}
                    </ul>
                {/if}

                <div class="tiny-grey-bar"></div>

                <CategorySummary
                        title="Loan"
                        accountCount={loanAccounts.length}
                        totalBalance={formatCurrency(loanAccounts.reduce((total, account) => total + account.balances.current, 0))}
                        onClick={() => toggleVisibility('loan')}
                />
                {#if visibility['loan']}
                    <ul>
                        {#each loanAccounts as account}
                            <AccountDetails {account} toggleVisibility={toggleVisibility} isVisible={visibility[account.name]}/>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/if}
    {:else}
        <div class='error' role='alert'>Please verify your email address</div>
    {/if}
</main>

<style>
    h1 {
        margin-top: 110px;
        margin-bottom: .5rem;
        font-size: 1.0625rem;
    }

    h2 {
        margin-top: 0;
        margin-bottom: 0;
    }

    .top-header {
        position: fixed; /* Changed from sticky to fixed */
        top: 0;
        left: 0; /* Ensures the header starts from the very left */
        right: 0; /* Ensures the header stretches to the right edge */
        background-color: white; /* Or any color fitting your design */
        z-index: 1000; /* Keeps the header above other content */
        padding: 25px 20px; /* Adjust the padding as needed */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Optional shadow for visual separation */
    }

    main {
        margin-top: 60px; /* Adjust based on your header's height */
        margin-left: 100px; /* Margin on the left */
        margin-right: 100px; /* Margin on the right */
        font-family: National2, -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica, ubuntu, roboto, noto, segoe ui, arial, sans-serif;
    }

    .error {
        color: red;
    }

    ul {
        list-style-type: none; /* Removes bullet points */
        padding-left: 1em; /* Retains indentation */
    }

    .button-container {
        display: flex; /* Enables Flexbox */
        justify-content: center; /* Center align items horizontally */
        align-items: center; /* Center align items vertically */
        flex-wrap: wrap; /* Allows buttons to wrap onto the next line if needed */
    }

    .range-button {
        margin: 5px; /* Optional: adds some space between the buttons */
        font-size: .9375rem;
        background-color: transparent; /* Makes background transparent */
        border: none; /* Removes the border */
        color: inherit; /* Inherits the text color from the parent */
        padding: 5px 10px; /* Adds some padding */
        cursor: pointer; /* Changes the cursor to indicate it's clickable */
        outline: none; /* Removes the outline */
        transition: background-color 0.3s, color 0.3s; /* Smooth transition for hover effect */
    }

    .range-button:hover, .range-button:focus {
        background-color: #f0f0f0; /* Light background on hover */
        color: #333; /* Darker text color on hover */
        border-radius: 10px; /* Optional: adds rounded corners */
    }

    .grey-bar {
        height: 8px; /* Sets the height of the bar */
        background-color: #edf1f3;; /* Sets the color of the bar to a light grey */
        width: 100%; /* Makes the bar extend full width of its container */
        margin: 20px 0; /* Adds some vertical space before and after the bar */
    }

    .tiny-grey-bar {
        height: 1px; /* Sets the height of the bar */
        background-color: #edf1f3;; /* Sets the color of the bar to a light grey */
        width: 100%; /* Makes the bar extend full width of its container */
        margin: 20px 0; /* Adds some vertical space before and after the bar */
    }
</style>
