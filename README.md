## Building a Flitered Stream Twitter Bot:

This project illustrates a data pipeline to generate filtered stream rules, and an automation script to post tweets using a registered Twitter account. Users work with a simple web-UI to enter rules, and mine tweets over an extended period of time. The tweet sets are then analysed using a Jupyter notebooks, to further refine the rules. This process is repeated until an acceptable set of rules is found. 

The pipeline sections are as follows:

### 1_DataMineInterface:

Uses a JQuery front-end to communicate and control an Express.JS back-end. This back-end acts as middleware, working as a simple interface for users to manipulate rules and stream from an endpoint. Matched tweets are printed to console, and written to a user specified output file.

### 2_RuleRefinement:

Tweet files are stored here, as well as Jupyter Notebooks for analysis. Some basic data frame analysis, and a set-difference algorithm to refine the rules (based on looking at frequencies of words in preferred and rejected tweets) has been implemented.

### 3_BotAutomation:

**Status:** Not started.


For now, the first two stages of this project have been worked out. For an extended period, rules will be developed and tested using the codebase I have built so far. Once a good set of rules is refined, the final bot script will be implemented, so this project can run on its own.


### Final Result:

In the end, I got the first two stages of the project completed. I realized a few things while working on this project:

- This project was really is about me exploring what is outside the Twitter's tweet selection algorithm. It was a way for me to escape the constructed filter bubble, and try to connect with other people. More specifically, I was looking for thoughtful and intelligent posters that had low follower/like numbers.
- After "looking outside the bubble", I was able to find some of these people. Unfortunately, even with rule refinements, the signal-to-noise ratio was still very low.
- I probably read through about 10000 tweets, and did about 5 revisions to my sets of rules. Perhaps out of 10k tweets, around 200 of them at most were "good".
- In the end, the content I was able to find was novel, but so sparse that it wasn't worth it to continue.
- Finally: On my main twitter account, my follows+muting of words and people I dislike has created an excellent feed already. I recently obtaind a feed with endlessly thoughtful comments, and infinite rabbit holes. The algorithm (when worked at enough) is already very good.

So now I just go on Twitter once or twice a week, and deep dive technical threads.

 Metaphorically, I have reached the [End of Twitter](https://www.youtube.com/watch?v=0dX75e9LS60).


This was an interesting experiement I had wished to try for a while, and now it is complete.