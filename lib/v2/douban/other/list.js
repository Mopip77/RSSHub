const got = require('@/utils/got');
const path = require('path');
const { art } = require('@/utils/render');
const { ratingToStars } = require('../utils');
const { buildBotCommandLink } = require('@/utils/telegram');
const { fallback, queryToInteger } = require('@/utils/readable-social');

module.exports = async (ctx) => {
    const type = ctx.params.type || 'subject_real_time_hotest';
    const routeParams = Object.fromEntries(new URLSearchParams(ctx.params.routeParams));
    const playable = fallback(undefined, queryToInteger(routeParams.playable), 0);
    const score = fallback(undefined, queryToInteger(routeParams.score), 0);
    let start = 0;
    const count = 50;
    let items = [];
    let title = '';
    let description = '';
    let total = null;
    while (total === null || start < total) {
        const url = `https://m.douban.com/rexxar/api/v2/subject_collection/${type}/items?playable=${playable}&start=${start}&count=${count}`;
        // eslint-disable-next-line no-await-in-loop
        const response = await got({
            method: 'get',
            url,
            headers: {
                Referer: `https://m.douban.com/subject_collection/${type}`,
            },
        });
        title = response.data.subject_collection.name;
        description = response.data.subject_collection.description;
        total = response.data.total;
        const newItems = response.data.subject_collection_items
            .filter((item) => {
                const rate = item.rating ? item.rating.value : 0;
                return rate >= score; // 保留rate大于等于score的项and过滤无评分项
            })
            .map((item) => {
                const title = item.title;
                const link = item.url;
                const rate = item.rating ? item.rating.value : null;
                const details = [];

                if (item.year) {
                    details.push({ label: '年份', value: item.year });
                }

                const genres = item.genres || item.genres_name;
                if (Array.isArray(genres) && genres.length) {
                    details.push({ label: '类型', value: genres.join(' / ') });
                }

                if (Array.isArray(item.countries) && item.countries.length) {
                    details.push({ label: '制片国家/地区', value: item.countries.join(' / ') });
                }

                if (Array.isArray(item.languages) && item.languages.length) {
                    details.push({ label: '语言', value: item.languages.join(' / ') });
                }

                if (Array.isArray(item.pubdate) && item.pubdate.length) {
                    details.push({ label: '首播/上映', value: item.pubdate.join(' / ') });
                } else if (item.pubdate) {
                    details.push({ label: '首播/上映', value: item.pubdate });
                }

                if (item.episodes_info) {
                    details.push({ label: '集数', value: item.episodes_info });
                } else if (Number.isFinite(item.episode_count)) {
                    details.push({ label: '集数', value: String(item.episode_count) });
                }

                if (Array.isArray(item.durations) && item.durations.length) {
                    details.push({ label: '单集片长', value: item.durations.join(' / ') });
                } else if (item.duration) {
                    details.push({ label: '片长', value: item.duration });
                }

                if (Array.isArray(item.aka) && item.aka.length) {
                    details.push({ label: '又名', value: item.aka.join(' / ') });
                }

                if (item.imdb) {
                    details.push({ label: 'IMDb', value: item.imdb });
                }

                if (Array.isArray(item.directors) && item.directors.length) {
                    details.push({
                        label: '导演',
                        value: item.directors
                            .map((d) => (typeof d === 'string' ? d : d.name))
                            .filter(Boolean)
                            .join(' / '),
                    });
                }

                if (Array.isArray(item.writers) && item.writers.length) {
                    details.push({
                        label: '编剧',
                        value: item.writers
                            .map((w) => (typeof w === 'string' ? w : w.name))
                            .filter(Boolean)
                            .join(' / '),
                    });
                }

                if (Array.isArray(item.actors) && item.actors.length) {
                    details.push({
                        label: '主演',
                        value: item.actors
                            .map((a) => (typeof a === 'string' ? a : a.name))
                            .filter(Boolean)
                            .join(' / '),
                    });
                }

                const description = art(path.join(__dirname, '../templates/list_description.art'), {
                    ranking_value: item.ranking_value,
                    title,
                    original_title: item.original_title,
                    rate,
                    stars: ratingToStars(rate),
                    card_subtitle: item.card_subtitle,
                    description: item.description || (item.cards ? item.cards[0].content : item.abstract),
                    telegram_search_link: buildBotCommandLink('kejiqubot', '/sq', title),
                    details,
                    cover: item.cover_url || item.cover?.url,
                });
                return {
                    title,
                    link,
                    description,
                };
            });
        items = [...items, ...newItems];
        start += count;
    }

    ctx.state.data = {
        title: `豆瓣 - ${title}`,
        link: `https://m.douban.com/subject_collection/${type}`,
        item: items,
        description,
    };
};
