import scrapy

class HabrParserItem(scrapy.Item):
    title = scrapy.Field()
    author = scrapy.Field()
    date = scrapy.Field()
    tags = scrapy.Field()
    views = scrapy.Field()
    comments = scrapy.Field()
    rating = scrapy.Field()
    link = scrapy.Field()
    preview_text = scrapy.Field()