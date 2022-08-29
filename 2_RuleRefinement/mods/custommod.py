#Makes imports and function calls easier.
#Imports and Settings:
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import altair as alt
from datetime import datetime
from datetime import timedelta
import os


#Settings
#from IPython.core.interactiveshell import InteractiveShell
#InteractiveShell.ast_node_interactivity = "all"
alt.renderers.enable('notebook')
alt.data_transformers.enable('default', max_rows=None)
#%matplotlib inline 
pd.set_option('display.max_rows', 100)
pd.set_option('display.max_columns', 40)
pd.set_option('display.width', 1000)


#BoxplotBlast Code:
###-------------------

#support functions:
#Signature: DataFrame, String -> DataFrame
#Purpose: Analyse a given numerical series. Construct a pseudo dataframe that mimics Q1,Q2,Q3 from series.
#add additional outlier/point information for Altair to interpret (in the prod_chart) method.
#Note: I assume 1.5*IRQ for the whiskers.
def df_gen(data,colname):
    df = data[colname]
    qDict = {"min":df.min(),
             "q0":0,
             "q1":df.quantile(0.25),
             "q2":df.median(),
             "q3":df.quantile(0.75),
             "q4":0,
             "max":df.max()}
    qDict["q0"] = qDict["q2"] - 1.5*(qDict["q3"] - qDict["q1"])
    qDict["q4"] = qDict["q2"] + 1.5*(qDict["q3"] - qDict["q1"])

    pseudoDF = pd.DataFrame({colname:colname,"datum":[qDict["q0"],qDict["q1"],qDict["q2"],qDict["q3"],qDict["q4"]]})

    if (qDict["min"] < qDict["q0"]): #Draw a Red Line just outside of Q0
         pseudoDF["outlierL"] = qDict["q0"]
    else:
        pseudoDF["min"] = qDict["min"]

    if (qDict["max"] > qDict["q4"]): #Draw a Red Line just outside of Q4
        pseudoDF["outlierR"] = qDict["q4"]
    else: #Draw a blue line for the maximum
        pseudoDF["max"] = qDict["max"]

    return pseudoDF

#Signature: String -> Boolean
#Check to see if a col type is in the given list.
def checklist(x):
    return (x in ["float32","float64","int16","int32","int64"]) #** Reasonable types? Corner Cases? 

def prod_chart(pseudoDF,colname):
    #Dataframe finished, make our chart.
    chart = alt.Chart(pseudoDF)

    #determine domain:
    axisRange = (pseudoDF["datum"].iloc[4]- pseudoDF["datum"].iloc[0])
    lower = pseudoDF["datum"].iloc[0] - axisRange*0.1
    upper = pseudoDF["datum"].iloc[4] + axisRange*0.1

    #make main chart
    mainChart = chart.mark_boxplot(extent=1.5,size=35,clip=True).encode(
        y=alt.Y(colname+":O",axis=alt.Axis(title=" ")),
        x=alt.X('datum:Q',
                scale=alt.Scale(domain=(lower, upper),zero=False),
                axis=alt.Axis(title=" "))).properties(
        height=100, width=400)

    #now lets determine the layers

    lowerLine = 0
    upperLine = 0

    if "outlierL" in pseudoDF.columns:
        lowerLine = chart.mark_rule(color='red').encode(
        x='outlierL:Q',
        size=alt.value(3))    
    if "min" in pseudoDF.columns:
        lowerLine = chart.mark_rule(color='blue').encode(
        x='min:Q',
        size=alt.value(3))

    if "outlierR" in pseudoDF.columns:
        upperLine = chart.mark_rule(color='red').encode(
        x='outlierR:Q',
        size=alt.value(3))
    if "max" in pseudoDF.columns:
        upperLine = chart.mark_rule(color='blue').encode(
        x='max:Q',
        size=alt.value(3))
        
    return (mainChart + lowerLine + upperLine)    

#Signature: DataFrame -> Chart
#Purpose: Extract all numerical columns form a data frame, and make a stacked bar chart for quick comparison
#of data rangers, outliers, bounds etc. This is a visual representation of the describe() method.

def boxplotblast(df):
    #first, identify numerical columns of dataframe
    dTypeSer = df.dtypes
    hold = dTypeSer.apply(checklist) #Ret bool selector
    numCols = df.columns[hold] #return index object; like an array/list
    finalChart = prod_chart(df_gen(df, numCols[0]),numCols[0]) #limit it for now!

    for i,item in enumerate(numCols[1:]):
        currChart = prod_chart(df_gen(df, item), item)
        finalChart = finalChart & currChart
    
    print("Guide: Blue lines indicate max/min value. Red Lines indicate cutoff of outliers.")
    
    return finalChart

###----------------------
### Timeline Visualization Code:

#Signature: DataFrame, String -> Altair Chart
#Purpose: Give a Dataframe, and a timestamp column. A heatmap will be produced.
#Note: Assumes the Timestamp() object column is in string form (fresh read from a csv or file).
#Pandas 0.25 should read these automatically when loading CSVs
#Do not pass datetime columns!

def dayheatmap(timeDF,tcol):
    if tcol not in timeDF.columns:
        raise ValueError("ERROR: time column given is not in DataFrame!")
    if not isinstance(timeDF[tcol].iloc[1],str):
        raise ValueError("ERROR: time column is not of type string!")
    if (timeDF.shape[0] < 1):
        raise ValueError("ERROR: Dataframe is empty (zero rows).")
    
    timeDF = timeDF.applymap(pd.Timestamp)
    #Conversion for
    timeDF["invoicedate"] = timeDF["invoicedate"].apply(lambda x: str(x.year) + "-" + str(x.month) + "-" + str(x.day))
    timeDF["mark"] = 1

    timeGroup = timeDF[["invoicedate","mark"]].groupby("invoicedate",as_index=False).count()
    
    heatChart = alt.Chart(timeGroup).mark_rect().encode(
      alt.X("yearmonth(invoicedate):O"),
      alt.Y("date(invoicedate):O"),
      alt.Color("mark"))

    return heatChart

###---------------------


###----------------------------
### HeadTailCSV Code:

#Signature: String, Integer -> NoneType
#Purpose: Grab every csv dataframe in a directory, and give a summary output of it for user.
#Defaults: Path=PWD, n=5. n specifies how many rows in the head/tail/body sections to sample.
def headtailcsvs(path=".",n=5):
    if not isinstance(path,str):
        raise ValueError("ERROR: path is not a string.")
    if not int(n) == n or n < 1:
        raise ValueError("ERROR: n is not an integer or < 1.")
    if (not os.path.exists(path)):
        raise ValueError("ERROR: path does not exist.")
    if (path[-1:] == "/" ): #I assume no trailing slash. If user added it, remove.
        path = path[:len(path) - 1]
     
    dirList = os.listdir(path)
    #Not efficient, but does the job. ¯\_(ツ)_/¯ Do FunProg tricks later.
    keepList = []
    for item in dirList:
        if item[-3:] == "csv":
            keepList.append(item)
    
    for item in keepList:
        currDF = pd.read_csv(path + "/" + item)
        if (currDF.shape[0] < 3*n):
            raise ValueError("ERROR: Can't sample csv file: " + item +". Rows < 3*n.")
        
        rowLen = currDF.shape[0]
        frames = [currDF.head(n),currDF.iloc[n:(rowLen - n)].sample(n).sort_index(axis=0),currDF.tail(n)]
        display(item)
        display(pd.concat(frames))
            
    return None