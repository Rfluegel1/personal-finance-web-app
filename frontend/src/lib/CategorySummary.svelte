<script>
    export let title;
    export let accountCount;
    export let totalBalance;
    export let onClick;
</script>

<button class="category-summary" on:click={onClick}>
    <div class="category-details">
        <h3>{title}</h3>
        <p>{accountCount} Accounts</p>
    </div>
    <div class="category-value">
        <p>{totalBalance}</p>
    </div>
</button>

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

    .category-details h3,
    .category-details p {
        margin: 0; /* Removes default margin for cleaner spacing */
    }

    .category-value p {
        margin: 0; /* Consistent styling with the left side */
        font-weight: bold; /* Makes the currency value bold */
    }
</style>
