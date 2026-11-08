export async function fetchWithRetry(url, retries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
            throw new Error(
                `Request failed: ${response.status} ${response.statusText}`
            );
            }

            return response;
        } catch (error) {
            lastError = error;

            console.warn(
            `Fetch failed (${attempt + 1}/${retries + 1})`,
            error
            );

            if (attempt < retries) {
            await new Promise(resolve =>
                setTimeout(resolve, 1000 * (attempt + 1))
            );
            }
        }
    }

    throw lastError;
}
