## Building a Flitered Stream Twitter Bot:

This project illustrates a data pipeline one can use to refine filtered stream rules, in which to program a twitter bot. Users work with a simple web-UI to enter rules, and mine tweets over an extended period of collection. The tweet sets are then analysed using a Jupyter notebook, to further refine the rules. This process is repeated until an acceptable set of rules is found. 

The pipeline sections are as follows:

### 1_DataMineInterface:

Uses a JQuery Front-End to communicate and control an Express.JS backend. This back-end acts as middleware, and acts as a simple interface for users to manipulate filtered stream rules, and stream from a filtered stream endpoint. Matched tweets are printed to console, and written to a user specified output file.

### 2_RuleRefinement:

Tweet files are stored here, as well as Jupyter notebooks for analysis. 

### 3_BotAutomation:

Users define their run-time parameters for a simple Heroku application, which skims the "best" tweets over a given time period, and retweets them for the user.

