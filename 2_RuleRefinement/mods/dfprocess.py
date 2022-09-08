import numpy as np 
import pandas as pd 
import altair as alt
import matplotlib.pyplot as plt
import re
import json

import os
print(os.listdir("./data"))

testFilePath = ""

#String, Int -> DataFrame!
def generatedataframe(path,writeLimit):
    if ((type(writeLimit) != int)):
        raise("Error: writeLimit not an integer. Check argument.")
        
    cols = ["tweetid", "text", "created_at",
            "tagid","tag","userid","username",
            "rtcount","repcount","likecount",
            "qtcount","tweet_type","ref_tweetid", "ref_authorid",
            "ref_rtcount","ref_repcount","ref_likecount",
            "ref_qtcount"]
    tempDF = pd.DataFrame(columns=cols)
    tweetDF = pd.DataFrame(columns=cols)
    lineCount = 0
    ##Note! On a rare occasion, two or more tags can match. THis currently chooses the first tag set
    ##Information loss can occur.
    with open(path) as fp:
        line = fp.readline()
        while line:
            if (lineCount == writeLimit):
                tweetDF = pd.concat([tweetDF,tempDF],copy=False).reset_index().drop(columns="index")
                tempDF = pd.DataFrame(columns=cols) #blow it all to hell!!
                lineCount = 0
            jsonObj = json.loads(line)
            #done for readibility, not code terseness
            c1 = jsonObj["data"]["id"]
            c2 = jsonObj["data"]["text"]
            c3 = jsonObj["data"]["created_at"]
            c4 = jsonObj['matching_rules'][0]["id"]
            c5 = jsonObj['matching_rules'][0]["tag"]
            c6 = jsonObj["data"]["author_id"]
            #Note: This assumes the first includes user is the poster (!)
            c7 = jsonObj["includes"]["users"][0]["username"]
            c8 = jsonObj["data"]["public_metrics"]["retweet_count"]
            c9 = jsonObj["data"]["public_metrics"]["reply_count"]
            c10 = jsonObj["data"]["public_metrics"]["like_count"]
            c11 = jsonObj["data"]["public_metrics"]["quote_count"]
            
            #Now check to see if our tweet is Original or Not.
            c12 = "original"
            c13 = 0
            if ("referenced_tweets" in jsonObj["data"]):
                c12 = jsonObj["data"]["referenced_tweets"][0]["type"]
                c13 = jsonObj["data"]["referenced_tweets"][0]["id"]
            
            #If there is a referenced tweet, get its metrics
            c14 = 0 #"ref_authorid"
            c15 = 0 #"ref_trcount" 
            c16 = 0 #"ref_repcount" 
            c17 = 0 #"ref_likecount"
            c18 = 0 #"ref_qtcount"
            if ("tweets" in jsonObj["includes"]):
                c14 = jsonObj["includes"]["tweets"][0]["author_id"] #"ref_authorid"
                c15 = jsonObj["includes"]["tweets"][0]["public_metrics"]["retweet_count"] #"ref_trcount" 
                c16 = jsonObj["includes"]["tweets"][0]["public_metrics"]["reply_count"] #"ref_repcount" 
                c17 = jsonObj["includes"]["tweets"][0]["public_metrics"]["like_count"] #"ref_likecount"
                c18 = jsonObj["includes"]["tweets"][0]["public_metrics"]["quote_count"] #"ref_qtcount"

            tempDF.loc[len(tempDF.index)] = [c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13,c14,c15,c16,c17,c18]    
    
            line = fp.readline()
            lineCount = lineCount + 1
                
        if (lineCount > 0): #cadd the last of the rows to final tweetDF.
            tweetDF = pd.concat([tweetDF,tempDF],copy=False).reset_index().drop(columns="index")
        fp.close()
        
    #Quickly convert to numbers.
    #Unlikely we will hit over 2^16 for tweet metrics. Also, are targets are little people anyways,
    #not huge twitter accounts. Downcasting will save some space.
    tweetDF = tweetDF.astype({"tweetid": "int64"}, copy=False) 
    tweetDF = tweetDF.astype({"tagid": "int64"}, copy=False) 
    tweetDF = tweetDF.astype({"userid": "int64"}, copy=False) 
    tweetDF = tweetDF.astype({"rtcount": "int16"}, copy=False) 
    tweetDF = tweetDF.astype({"repcount": "int16"}, copy=False) 
    tweetDF = tweetDF.astype({"likecount": "int16"}, copy=False) 
    tweetDF = tweetDF.astype({"qtcount": "int16"}, copy=False) 
    tweetDF = tweetDF.astype({"ref_tweetid": "int64"}, copy=False) 
    tweetDF = tweetDF.astype({"ref_authorid": "int64"}, copy=False) 
    tweetDF = tweetDF.astype({"ref_rtcount": "int16"}, copy=False) 
    tweetDF = tweetDF.astype({"ref_repcount": "int16"}, copy=False) 
    tweetDF = tweetDF.astype({"ref_likecount": "int16"}, copy=False) 
    tweetDF = tweetDF.astype({"ref_qtcount": "int16"}, copy=False) 

    #[!] for now, I don't use the date string, eventhough it is recorded. To be formatted into a DateTime object later

    tweetDF.info()
    return tweetDF

'''
Awful Slang strings to eliminate
'''

screenWords = ["celebs","frfr","fr fr","lulz","rofl",
              "roflmao","lmao","lol","chuds","yall","y'all",
              "dem","demz","hella","cums","onlyfans","only fans",
              "plz","pls","noob","grindset","vibe","vibrations",
              "gurl","chill","nft","coom","cringe","based","alpha",
               "beta","sigma","mindset","babe","tpot","flex",
               "moon","pumps","apes","celeb","cuck","cucked",
              "smh","goes hard"," stan ","jesus","lord"," da ",
               "ass","mfers","mfer","thicc","nigga","!!","!!!",
              "??","???","http://","https://","ya'll"]


'''Credit for this non-english character removal function goes to 
Karim Omaya, their answer was found at this stack overflow page:
https://stackoverflow.com/questions/33404752/removing-emojis-from-a-string-in-python
'''
def remove_noneng_chars(data):
    emoj = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002500-\U00002BEF"  # chinese char
        u"\U00002702-\U000027B0"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        u"\u2640-\u2642" 
        u"\u2600-\u2B55"
        u"\u200d"
        u"\u23cf"
        u"\u23e9"
        u"\u231a"
        u"\ufe0f"  # dingbats
        u"\u3030"
                      "]+", re.UNICODE)
    return re.sub(emoj, '', data)

def remove_punct(data):
    replace = re.compile("["
        "."
        "!"
        "?"
        "\n"
        "/"
        "\""
        ","
        "}"
        "{"
        "["
        "]"
        "<"
        ">"
        "("
        ")"
        "+"
        ":"
        ";"
                    "]+", re.UNICODE)
    return re.sub(replace,"",data)


'''
Another stirng function, does what I need. This was written by user Boa on 
Stack Overflow: https://stackoverflow.com/questions/30606124/most-efficient-way-to-remove-multiple-substrings-from-string
'''

def eliminate_slang_strings(cur_string, replace_list):
    retWord = cur_string
    for cur_word in replace_list:
        if cur_word in cur_string:
            retWord = ""
    return retWord

def cleanDF(tDF):
    tDF.drop_duplicates(subset=["text"],inplace=True)
    tDF['text'] = tDF["text"].apply(lambda s: s.lower())
    tDF['text'] = tDF["text"].apply(lambda s: eliminate_slang_strings(s,screenWords))
    tDF['text'] = tDF["text"].apply(lambda s: remove_punct(s))
    tDF['text'] = tDF["text"].apply(lambda s: remove_noneng_chars(s))
    return tDF
