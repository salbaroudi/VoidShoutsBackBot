## Building a Flitered Stream Twitter Bot:

This project illustrates a data pipeline to generate filtered stream rules, and an automation script to post tweets using a registered Twitter account. Users work with a simple web-UI to enter rules, and mine tweets over an extended period of time. The tweet sets are then analysed using a Jupyter notebooks, to further refine the rules. This process is repeated until an acceptable set of rules is found. 

The pipeline sections are as follows:

### 1_DataMineInterface:

Uses a JQuery front-end to communicate and control an Express.JS back-end. This back-end acts as middleware, working as a simple interface for users to manipulate rules and stream from an endpoint. Matched tweets are printed to console, and written to a user specified output file.

**Status:** Functioning, with some issues (usable).

### 2_RuleRefinement:

Tweet files are stored here, as well as Jupyter Notebooks for analysis. 

**Status:** In development.

### 3_BotAutomation:

Users define their run-time parameters for a simple Heroku application, which skims the "best" tweets over a given time period, and retweets them for the user.

**Status:** Not started.