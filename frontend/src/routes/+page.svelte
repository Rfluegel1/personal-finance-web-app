<script>
    import {onMount} from 'svelte';
    import axios from 'axios';
    import drawChart from "$lib/drawGraph.js";

    let isEmailVerified = false;
    let error = '';
    let banks = [];
    let link_token = '';
    let handler;
    let netWorths = [];
    let visibility = {}
    let isLoading = false;
    let existingBankHandlers = {}

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

    async function processBanks(banks) {
        for (const bank of banks) {
            if (bank.error === 'ITEM_LOGIN_REQUIRED') {
                console.log('creating update link token');
                await createUpdateLinkToken(bank);
            }
        }
    }

    onMount(async () => {
        try {
            const linkTokenResponse = await axios.post('/api/create_link_token')
            link_token = linkTokenResponse.data.link_token
            initializePlaid();
            await processBanks(banks)
        } catch (e) {
            error = 'Failed to create link token'
        }
    });

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
            },
            onExit: (err, metadata) => {
                if (err) {
                    error = 'Plaid link error'
                }
            }
        });
    }

    function initializeUpdatePlaid(bankName) {
        existingBankHandlers[bankName].handler = Plaid.create({
            token: existingBankHandlers[bankName].linkToken,
            onSuccess: async (public_token, metadata) => {
                // try {
                //     isLoading = true;
                //     await axios.post('/api/exchange_token_and_save_bank', {public_token})
                // } catch (e) {
                //     error = 'Failed to save bank'
                // } finally {
                //     isLoading = false;
                // }
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
            onExit: (err, metadata) => {
                if (err) {
                    error = 'Plaid link error'
                }
            }
        });
    }

    function toggleVisibility(name) {
        if (visibility[name]) {
            visibility[name] = false;
        } else {
            visibility[name] = true;
        }
    }

    async function createUpdateLinkToken(bank) {
        console.log('creating update link token')
        try {
            let response = await axios.post('/api/create_update_link_token', {itemId: bank.itemId})
            console.log(response.data.linkToken)
            existingBankHandlers[bank.name] = {linkToken: response.data.linkToken, handler: null}
            initializeUpdatePlaid(bank.name)
            console.log(existingBankHandlers)
        } catch (e) {
            error = 'Failed to create update link token'
        }
    }
</script>

<svelte:head>
    <script
            src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
    ></script>
</svelte:head>

<main>
    <h1>Net Worth</h1>
    {#if error}
        <div class='error' role='alert'>{error}</div>
    {/if}
    {#if isEmailVerified}
        <div>
            <a href='/logout'>Logout</a>
        </div>
        <div>
            <a href='/email-change'>Change Email</a>
        </div>
        <div>
            <a href='/password-reset-request'>Change Password</a>
        </div>
        <button id='add-bank' on:click={handler.open()} disabled={!link_token || isLoading}>Add Bank</button>
        {#if netWorths.length > 0}
            <h2>${netWorths[netWorths.length - 1].value.toFixed(2)}</h2>
        {/if}
        <div id="chart-container">
            <svg id="chart"></svg>
        </div>
        {#if isLoading}
            <div>Loading...</div>
        {/if}
        <div class='bank-list'>
            <ul>
                {#each banks as bank}
                    <div class='bank-item'>
                        <li>
                            <h2>{bank.name}</h2>
                            {#if bank.error === 'ITEM_LOGIN_REQUIRED'}
                                <div class='error' role='alert'>{bank.error}</div>
                                <button id={`${bank.name}-login-button`}
                                        on:click={existingBankHandlers[bank.name]?.handler.open()}
                                        disabled={!existingBankHandlers[bank.name]?.linkToken || isLoading}>
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
