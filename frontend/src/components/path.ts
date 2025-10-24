const app_name = 'vasupradha.xyz';

export function buildPath(route: string): string {
    if (import.meta.env.MODE !== 'development') {
        // Vite: import.meta.env.MODE
        return `http://${app_name}:5000/${route}`;
    } else {
        return `http://localhost:5000/${route}`;
    }
}