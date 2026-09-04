from .greenhouse import GreenhouseScraper
from .careerpage import CareerPageScraper
from .amazon import AmazonScraper
from .ashby import AshbyScraper
from .lever import LeverScraper
from .instahyre import InstahyreScraper

SCRAPERS = {
    "greenhouse": GreenhouseScraper,
    "careerpage": CareerPageScraper,
    "amazon": AmazonScraper,
    "ashby": AshbyScraper,
    "lever": LeverScraper,
    "instahyre": InstahyreScraper,
}
