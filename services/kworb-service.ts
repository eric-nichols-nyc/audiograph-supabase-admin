

export const getKworbData = async (artistName: string) => {
    const url = `https://kworb.net/youtube/artist/${artistName}.html`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

