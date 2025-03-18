


export const GET = async () => {

    console.log('Getting artists');
    // try catch call to action
    try {
        const result = await getArtists();

        return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
    } catch (error) {
        console.error('Error loading artists:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error loading artists' }), { status: 500 });
    }
};


const getArtists = async () => {
    return [
        {
            name: "Bruno Mars",
            image:
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=112,147,170,170",
        },
        {
            name: "The Neighbourhood",
            image:
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=370,147,170,170",
        },
        {
            name: "Jack Harlow",
            image:
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=628,147,170,170",
        },
        {
            name: "Drake",
            image:
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=886,147,170,170",
        },
        {
            name: "French Montana",
            image:
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=1144,147,170,170",
        },
    ]
};