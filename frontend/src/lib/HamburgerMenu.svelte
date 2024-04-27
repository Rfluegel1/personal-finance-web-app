<script>
    export let links = []; // Array of link objects { url, label }
    let showMenu = false;

    function toggleMenu() {
        showMenu = !showMenu;
    }
</script>

<div class="hamburger-menu">
    <button class="hamburger-button" on:click={toggleMenu}>☰</button>
    <div class="menu-items" style:display="{showMenu ? 'block' : 'none'}">
        {#each links as link}
            <a href={link.url}>{link.label}</a>
        {/each}
    </div>
</div>

<style>
    .hamburger-menu {
        position: relative;
        display: inline-block;
    }

    .hamburger-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
    }

    .menu-items {
        display: none; /* Initially hidden, display controlled by Svelte */
        position: absolute;
        background-color: #f9f9f9;
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
    }

    .menu-items a {
        color: black;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
    }

    .menu-items a:hover {
        background-color: #f1f1f1;
    }
</style>
