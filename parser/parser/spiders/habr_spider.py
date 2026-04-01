import scrapy
from parser.items import HabrParserItem


class HabrSpider(scrapy.Spider):
    name = "habr"
    allowed_domains = ["habr.com"]
    start_urls = ["https://habr.com/ru/articles/"]

    custom_settings = {
        "DOWNLOAD_DELAY": 0.5,          # было 1.5
        "RANDOMIZE_DOWNLOAD_DELAY": False,
        "CONCURRENT_REQUESTS": 8,        # параллельных запросов (по умолчанию 16, но к одному домену мало)
        "CONCURRENT_REQUESTS_PER_DOMAIN": 4,  # было 1 по умолчанию
        "DEFAULT_REQUEST_HEADERS": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "ru-RU,ru;q=0.9",
        },
    }
    def parse(self, response):
        articles = response.css("article.tm-articles-list__item:not(.tm-voice-article)")
        self.logger.info(f"[parse] Найдено article-блоков: {len(articles)} на {response.url}")

        for article in articles:
            link = (
                article.css("a.tm-title__link::attr(href)").get()
                or article.css("h2 a::attr(href)").get()
            )

            if link:
                link = response.urljoin(link)
                item = HabrParserItem()
                item['link'] = link
                item['author'] = article.css(".tm-user-info__username::text").get(default="").strip()
                # Теги берём здесь — они есть в статическом HTML карточки
                item['tags'] = article.css("a.tm-publication-hub__link span:first-child::text").getall()
                yield response.follow(
                    link,
                    callback=self.parse_full_article,
                    meta={'item': item}
                )
            else:
                self.logger.warning(f"[parse] Ссылка не найдена. HTML:\n{article.get()[:300]}")

        next_page = response.css("a[rel='next']::attr(href)").get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)

    def parse_full_article(self, response):
        item = response.meta['item']

        # h1 span::text — единственный рабочий селектор для заголовка
        item['title'] = response.css("h1 span::text").get(default="").strip()

        first_paragraph = response.css("div.article-formatted-body p::text").get()
        item['preview_text'] = first_paragraph.strip() if first_paragraph else ""

        item['date'] = response.css("time::attr(datetime)").get()

        rating_text = response.css(".tm-votes-meter__value::text").get()
        try:
            item['rating'] = int(rating_text.strip()) if rating_text else 0
        except ValueError:
            item['rating'] = 0

        self.logger.info(f"[parse_full_article] title='{item.get('title')}', tags={item.get('tags')}")
        yield item