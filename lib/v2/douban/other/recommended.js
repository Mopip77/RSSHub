const got = require('@/utils/got');
const path = require('path');
const { art } = require('@/utils/render');
const { ratingToStars } = require('../utils');
const { fallback, queryToInteger } = require('@/utils/readable-social');

module.exports = async (ctx) => {
    const subjectType = ctx.params.type || 'tv';
    const apiKey = '0ac44ae016490db2204ce0a042db2916';
    let url = `https://frodo.douban.com/api/v2/skynet/new_playlists?apikey=${apiKey}&subject_type=${subjectType}`;
    let response = await got({
        method: 'get',
        url,
        headers: {
            'User-Agent': 'MicroMessenger/',
            Referer: 'https://servicewechat.com/wx2f9b06c1de1ccfca/91/page-frame.html',
        },
    });

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const mon = month < 10 ? '0' + month : month.toString();

    let items = response.data.data[0].items;

    const subjectCollectionId = items.find((item) => item.title.startsWith(`${year}年${mon}月`)).id;

    const routeParams = Object.fromEntries(new URLSearchParams(ctx.params.routeParams));
    const playable = fallback(undefined, queryToInteger(routeParams.playable), 0);
    const score = fallback(undefined, queryToInteger(routeParams.score), 0);

    url = `https://m.douban.com/rexxar/api/v2/subject_collection/${subjectCollectionId}/items?playable=${playable}`;
    response = await got({
        method: 'get',
        url,
        headers: {
            Referer: `https://m.douban.com/subject_collection/${subjectCollectionId}`,
        },
    });
    const description = response.data.subject_collection.description;
    items = response.data.subject_collection_items
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
                details,
                cover: item.cover_url || item.cover?.url,
            });
            return {
                title,
                link,
                description,
            };
        });
    ctx.state.data = {
        title: `豆瓣 - ${response.data.subject_collection.name}`,
        link: `https://m.douban.com/subject_collection/${subjectCollectionId}`,
        item: items,
        description,
    };
};
