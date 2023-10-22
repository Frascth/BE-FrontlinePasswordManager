export const route = [
    {
        method : "GET",
        path : "/",
        handler : () => { return "Welcome to Frontline Password Manager" }
    },
    {
        method : "*",
        path : "/",
        handler : () => { return "Welcome to Frontline Password Manager" }
    }
];
