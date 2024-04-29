<script>
    import { formatCurrency } from '$lib/formatters';
    export let account;
    export let toggleVisibility;
    export let isVisible;
</script>

<li>
    <button class="category-summary" on:click={() => toggleVisibility(account.name)}>
        <div class="category-details">
            <h3>{account.name}</h3>
        </div>
        <div class="category-value">
            <p>{formatCurrency(account.balances.current)}</p>
        </div>
    </button>
    {#if isVisible}
        {#if account.transactions.length > 0}
            <table id="{account.name}-transactions">
                <thead>
                <tr>
                    <th>Transaction Value</th>
                    <th>Transaction Date</th>
                </tr>
                </thead>
                <tbody>
                {#each account.transactions as transaction}
                    <tr>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>{transaction.date}</td>
                    </tr>
                {/each}
                </tbody>
            </table>
        {:else}
            <div>No transactions</div>
        {/if}
    {/if}
</li>

<style>
    button.category-summary {
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        padding: 10px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    button.category-summary:hover {
        background-color: #f0f0f0;
    }

    .category-details h3 {
        margin: 0; /* Removes default margin for cleaner spacing */
    }

    .category-value p {
        margin: 0; /* Consistent styling with the left side */
        font-weight: bold; /* Makes the currency value bold */
    }
</style>