function ratingToStars(rating) {
    const r = Number(rating);
    if (!Number.isFinite(r) || r <= 0) {
        return 0;
    }

    // Douban commonly uses 10-point ratings displayed as 0-5 stars.
    // Use threshold mapping instead of strict linear proportion.
    if (r >= 9) {
        return 5;
    }
    if (r >= 7.5) {
        return 4;
    }
    if (r >= 6) {
        return 3;
    }
    if (r >= 4.5) {
        return 2;
    }
    if (r >= 3) {
        return 1;
    }
    return 0;
}

module.exports = {
    ratingToStars,
};
