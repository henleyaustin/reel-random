const axios = require('axios');
const cheerio = require('cheerio');

class IMDbService {
    constructor () {
        this.baseURL = 'https://www.imdb.com';
    }

    async fetchPage (url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch the IMDb page: ${error.message}`);
        }
    }

    parseMoviesFromPage (html) {
        const $ = cheerio.load(html);
        const movies = [];

        // Loop through each movie element and extract title and link
        $('a.ipc-title-link-wrapper').each((index, element) => {
            var title = $(element).find('h3.ipc-title__text').text().trim();

            // Remove leading numbers
            title = title.replace(/^\d+\.\s*/, '');

            const link = `${this.baseURL}${$(element).attr('href')}`;

            if (title && link) {
                movies.push({ title, link });
            }
        });

        return movies;
    }

    async getMoviesFromIMDb (url) {
        const html = await this.fetchPage(url);
        const movies = this.parseMoviesFromPage(html);
        return movies;
    }
}

module.exports = new IMDbService();
