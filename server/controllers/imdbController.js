const imdbService = require('../services/scraper');

exports.getMoviesForUser = async (req, res) => {
    try {
        const { watchlistUrl } = req.body;

        if (!watchlistUrl) {
            return res.status(400).json({ message: 'IMDb URL is required' });
        }

        const movies = await imdbService.getMoviesFromIMDb(watchlistUrl);
        return res.json(movies);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
