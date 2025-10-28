// const app_name = 'vasupradha.xyz';

// export function buildPath(route: string): string {
//     if (import.meta.env.MODE !== 'development') {
//         // Vite: import.meta.env.MODE
//         return `http://${app_name}:5000/${route}`;
//     } else {
//         return `http://localhost:5000/${route}`;
//     }
// }

const app_name = 'vasupradha.xyz';

export function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    // Use HTTPS in production
    return `https://${app_name}${route.startsWith('/') ? route : `/${route}`}`;
  } else {
    // Local development
    return `http://localhost:5000${route.startsWith('/') ? route : `/${route}`}`;
  }
}
