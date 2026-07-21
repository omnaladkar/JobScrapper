from .greenhouse import GreenhouseScraper
from .careerpage import CareerPageScraper
from .amazon import AmazonScraper

SCRAPERS = {
    "greenhouse": GreenhouseScraper,
    "careerpage": CareerPageScraper,
    "amazon": AmazonScraper,
}
