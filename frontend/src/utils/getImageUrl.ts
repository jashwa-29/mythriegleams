export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
        return `${baseUrl}${encodeURI(path)}`;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return encodeURI(cleanPath);
};
