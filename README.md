# ADA Project Proposition: World Universities as ranked by their prominence on the web
Alternative world university rankings based on their search engine visibility

## Abstract 
Traditionally universities have been ranked on how many times their papers have been cited. We are proposing a new ranking metric for the digital era, in which we look at which universities come out top on google searches. This is basically a proxy for how many times their website has been cited (i.e. linked to) by other sites. 

Keywords: web scraping, university rankings, google rankings, data analysis

Questions:
-	Which universities are the best ranked based on internet (search engine) visibility ?
-	How does EPFL compare to other universities on search ranking ? 
-	What opportunities can we find for EPFL to improve their search ranking

Read more about the idea here:
http://www.rankfalcon.com/blog/page/3/google-search-for-data-science:-on-measuring-importance-%26-popularity/

## Data description

### The idea

There are thousands, if not tens of thousands, of search queries that lead you to a university’s website through Google, from “computer science masters” to “best universities in Switzerland” to “which university should I choose”. 
For each search query, many different universities’ webpages appear in a certain order. For example, when searching for “computer science masters”, the first result might be EPFL’s website, the second result might be MIT’s website etc. This gives us the notion of a website’s search ranking.

The idea is to aggregate search rankings over thousands of keywords for a selection of 100 or so universities. We can then average out our data over all the keywords to derive a new university world ranking, sorted by internet visibility (visibility on Google). We take it for granted that Google's aim is to show you the best and most pertinent results, and thereby a high Google ranking is correlated with a good university reputation (although we could study this by comparing the correlation between our ranking, and traditional rankings).

### How we can explore the data

There are many different ways to aggregate and study the data. For example, we can group by subject: which university comes out top for Computer Science? We can also group by Bachelor/Master, by country, by language and by types of search request. For example, maybe some universities come out top on questions (Which is the best uni for <subject>?) while others rank better for more direct queries (computer science bachelor). We can also look at what people are searching when they arrive on a university site. What type of questions are they asking ?

We can also get a time series of rankings to see how the ranking has evolved over a period of time. For example, we could see which universities are on an upwards trend or downwards trend and plot the evolution of different universities against each other.

### Data cross referencing

Google’s apis are a goldmine for data. With sources like google keyword planner and google search console we can extract data like the CPC (cost per click: how much people will pay for an ad on a given keyword), search volume (how many people have searched for a query in a given month), CTR (click through rate, ratio of how many people click on your site to how many people have seen your site on google) etc.

We can extract this data for all of the keywords and cross reference it with our search ranking data. This can allow us, for example, to weight our results depending on the importance of a keyword. For example, a university might be really highly ranked for a given keyword, but if only 3 people search for this keyword a month, this ranking is not particularly relevant.


## Feasibility/Risks

Getting the data: essentially we get all the data either by scraping search rankings (with dedicated tools like RankFalcon) or through Google apis (keyword planner, search console).

## Deliverables

- An overall ranking
- Rankings according to different criteria (subject, country etc)
- Visualisations (interactive maps, interactive charts, graph mapping links between university pages)
- Article on results
- Suggestions for improving EPFL's SEO based on our observations

## Timeplan

November 1st half: Defining the scope: universities and keywords to use  
November 2nd half: Getting the data and initial data exploration  
December 1st half: Data analysis, building the ranking   
December 2nd half: Initial work on visualisations  
January: Finish visualisations and results presentation  
