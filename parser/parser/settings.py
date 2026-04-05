BOT_NAME = 'habr_parser'
SPIDER_MODULES = ['parser.spiders']
NEWSPIDER_MODULE = 'parser.spiders'

ROBOTSTXT_OBEY = True
DOWNLOAD_DELAY = 1  # чтобы не нагружать сервер

# FEED_FORMAT = "json"
# FEED_URI = "habr_articles.json"

ITEM_PIPELINES = {
    'parser.pipelines.SQLitePipeline': 300,
}