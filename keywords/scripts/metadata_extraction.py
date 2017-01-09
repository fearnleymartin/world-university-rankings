'''
This scripts allows you to automatically extract keyword metadata from Google keyword planner via scraping with selenium
TODO: group keywords into groups of 10 and run for each query
'''

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
import selenium.webdriver.support.wait
from credentials import email, password
import collections
import pandas as pd

selenium.webdriver.support.wait.POLL_FREQUENCY = 0.05

chrome_driver_path = 'C:/Users/Fearnley/Downloads/chromedriver_win32/chromedriver.exe'
keywords_file = '../type1.txt'
output_file = '../type1_metadata.txt'

class AdwordsAutomater(object):
    def __init__(self, email, passwd):
        self.email = email
        self.passwd = passwd
        try:
            self.ff = webdriver.Chrome(chrome_driver_path)
        except:
            self.ff = webdriver.Firefox()
            self.ff.set_page_load_timeout(30)
        self.ff.implicitly_wait(90)
        self.busy = False
        self.is_login = False
        self.on_keyword_page = False
        self.kwurl = ''

    def login(self):
        email, passwd = self.email, self.passwd
        try:
            print ('getting adwords.google.com')
            login_url = 'https://accounts.google.com/ServiceLogin?service=adwords&continue=https://adwords.google.com/um/identity?hl%3Den%26sourceid%3Dawo%26subid%3Dww-ww-di-g-aw-a-awhp_1!o2&hl=en&ltmpl=signin&passive=0&skipvpage=true#identifier'
            # self.ff.get('https://adwords.google.com')
            self.ff.get(login_url)
        except TimeoutException:
            pass
        self.ff.find_element_by_id("Email").send_keys(email)
        next_button = self.ff.find_element_by_id('next')
        print('next')
        next_button.submit()
        self.ff.find_element_by_id("Passwd").send_keys(passwd)
        signin = self.ff.find_element_by_id('signIn')
        try:
            print ('submit login form')
            signin.submit()
        except TimeoutException:
            pass
        self.is_login = True
        self.kwurl = 'https://adwords.google.com/ko/KeywordPlanner/Home?__c=2477069647&__u=4892490866&authuser=0&__o=cues#start'

    def find_keyword_volumes(self, keywords):
        if not self.is_login:
            self.login()

        if not isinstance(keywords, collections.Iterable):
            keywords = [keywords]

        # first_batch_keywords = keywords[:10]
        # rest_of_keywords = keywords[10:]

        # print(self.email, 'querying', keywords)
        self.busy = True
        ret = {}

        print('visiting keyword tools')
        self.ff.get(self.kwurl)

        collapsed_menu = self.ff.find_element_by_id('gwt-debug-splash-panel-search-selection-input')
        collapsed_menu.click()

        # First batch
        n = 25  # batch size
        for batch in [keywords[i:i+n] for i in range(1, len(keywords), n)]:
            print(batch)
            # unfold menu

            kwinput = self.ff.find_element_by_id('gwt-debug-keywords-text-area')
            kwinput.send_keys('\n'.join(batch))

            self.ff.find_element_by_id('gwt-debug-search-button-content').click()

            data = []
            # df = pd.DataFrame(columns=['keyword', 'search volume', 'competition', 'cpc'])
            for i in range(len(batch)):
                try:
                    keyword_name = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-KEYWORD-row-{}-0"]/div'.format(i))[0].text
                    search_volume = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-SEARCH_VOLUME_PRIMARY-row-{}-0"]'.format(i))[0].text
                    competition = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-COMPETITION-row-{}-1"]'.format(i))[0].text
                    cpc = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-SUGGESTED_BID-row-{}-2"]/div'.format(i))[0].text
                except Exception:
                    keyword_name = \
                    self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-KEYWORD-row-{}-0"]/div'.format(i))[0].text
                    search_volume = self.ff.find_elements_by_xpath(
                        '//*[@id="gwt-debug-column-SEARCH_VOLUME_PRIMARY-row-{}-0"]'.format(i))[0].text
                    competition = \
                    self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-COMPETITION-row-{}-1"]'.format(i))[0].text
                    cpc = \
                    self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-SUGGESTED_BID-row-{}-2"]/div'.format(i))[
                        0].text

                data.append(dict(keyword_name=keyword_name, search_volume=search_volume, competition=competition, cpc=cpc))
            print(data[-10:])
            print('going back')
            self.ff.back()

        self.busy = False

        # print('done first batch')
        # print(data)
        #
        # # second batch
        # n = 10  # batch size
        # if len(rest_of_keywords) > 0 :
        #     for batch in [rest_of_keywords[i:i+n] for i in range(1,len(rest_of_keywords),n)]:
        #         # Query + click
        #         query_box = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-keywords-text-area"]')[0]
        #
        #         query_box.send_keys('\n'.join(batch))
        #         self.ff.find_elements_by_xpath('//*[@id="gwt-debug-search-button"]/div/div/div/div[2]')[0].click()
        #
        #         for i in range(len(batch)):
        #             keyword_name = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-KEYWORD-row-{}-0"]/div'.format(i))[0].text
        #             search_volume = self.ff.find_elements_by_xpath(
        #                 '//*[@id="gwt-debug-column-SEARCH_VOLUME_PRIMARY-row-{}-0"]'.format(i))[0].text
        #             competition = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-COMPETITION-row-{}-1"]'.format(i))[0].text
        #             cpc = self.ff.find_elements_by_xpath('//*[@id="gwt-debug-column-SUGGESTED_BID-row-{}-2"]/div'.format(i))[0].text
        #
        #             data.append(
        #                 dict(keyword_name=keyword_name, search_volume=search_volume, competition=competition, cpc=cpc))

        df = pd.DataFrame(data)
        return df

if __name__ == "__main__":
    with open(keywords_file) as kf:
        keywords = kf.readlines()
    aa = AdwordsAutomater(email=email, passwd=password)
    df_keyword_metadata = (aa.find_keyword_volumes(keywords))
    df_keyword_metadata.to_csv(output_file)
