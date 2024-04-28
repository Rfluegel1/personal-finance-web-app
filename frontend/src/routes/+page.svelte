<script>
    import {onMount} from 'svelte';
    import axios from 'axios';
    import drawChart from "$lib/drawGraph.js";
    import HamburgerMenu from "$lib/HamburgerMenu.svelte";
    import data from '$lib/overviewResponse.json'

    let isEmailVerified = true;
    let error = '';
    let banks = [];
    let link_token = '';
    let handler;
    let netWorths = [];
    let visibility = {}
    let isLoading = false;
    let bankHandlers = {}
    let links = [
        { url: '/logout', label: 'Logout' },
        { url: '/email-change', label: 'Change Email' },
        { url: '/password-reset-request', label: 'Change Password' }
    ];

    onMount(async () => {
        try {
            isEmailVerified = (await axios.get('/api/users/is-verified')).data.isVerified;
        } catch (e) {
            error = 'Failed to verify user'
        }
        if (isEmailVerified) {
            try {
                isLoading = true;
                // await axios.get('/api/overview').then(response => {
                //     banks = response.data.banks
                //     netWorths = response.data.netWorths
                // })
                banks = data.banks
                netWorths = data.netWorths
            } catch (e) {
                error = 'Failed to get overview'
            } finally {
                isLoading = false;
            }
            setTimeout(() => {
                drawChart(netWorths);
            }, 1000)
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

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,   // No decimal places,
        }).format(value);
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
            <button id="1M" on:click={() => filterData('1M')}>1M</button>
            <button id="3M" on:click={() => filterData('3M')}>3M</button>
            <button id="6M" on:click={() => filterData('6M')}>6M</button>
            <button id="YTD" on:click={() => filterData('YTD')}>YTD</button>
            <button id="1Y" on:click={() => filterData('1Y')}>1Y</button>
            <button id="2Y" on:click={() => filterData('2Y')}>2Y</button>
        </div>
        {#if isLoading}
            <div>Loading...</div>
        {/if}
        <button id='add-bank' on:click={handler.open()} disabled={!link_token || isLoading}>Add Bank</button>
        <div class='bank-list'>
            <ul>
                {#each banks as bank}
                    <div class='bank-item'>
                        <li>
                            <h2>{bank.name}</h2>
                            {#if bank.error === 'ITEM_LOGIN_REQUIRED'}
                                <div class='error' role='alert'>{bank.error}</div>

                                <button id={`${bank.name}-login-button`}
                                        on:click={bankHandlers[bank.name]?.handler.open()}
                                        disabled={!bankHandlers[bank.name]?.handler}>
                                    Authenticate Bank
                                </button>
                            {:else}
                                <button id={`${bank.name}-button`} on:click={() => toggleVisibility(bank.name)}>
                                    {visibility[bank.name] ? 'Hide' : 'Show'} Accounts
                                </button>
                            {/if}
                            <ul>
                                {#if visibility[bank.name]}
                                    {#each bank.accounts as account}
                                        <li><h3>{account.name}</h3></li>
                                        {#if account.transactions.length > 0}
                                            <button id={`${account.name}-button`}
                                                    on:click={() => toggleVisibility(account.name)}>
                                                {visibility[account.name] ? 'Hide' : 'Show'} Transactions
                                            </button>
                                        {/if}
                                        {#if visibility[account.name]}
                                            <table id={`${account.name}-transactions`}>
                                                <thead>
                                                <tr>
                                                    <th>Transaction Value</th>
                                                    <th>Transaction Date</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {#each account.transactions as transaction}
                                                    <tr>
                                                        <td>${transaction.amount.toFixed(2)}</td>
                                                        <td>{transaction.date}</td>
                                                    </tr>
                                                {/each}
                                                </tbody>
                                            </table>
                                        {/if}
                                    {/each}
                                {/if}
                            </ul>
                        </li>
                    </div>
                {/each}
            </ul>
        </div>
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
        box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Optional shadow for visual separation */
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

    .bank-list ul {
        list-style-type: none; /* Removes bullet points */
        padding-left: 1em; /* Retains indentation */
    }

    .bank-list ul ul { /* Targeting nested ul for accounts specifically */
        padding-left: 1em; /* You can adjust this value to control the indentation */
    }
</style>
