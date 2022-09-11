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
