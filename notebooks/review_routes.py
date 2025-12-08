import streamlit as st
import folium
from folium.plugins import Draw
from streamlit_folium import folium_static, st_folium
import os
from glob import glob
from src.parse_gpx import process_gpx_to_df
import numpy as np
from geopy.distance import geodesic 
from shapely import Point
from shapely import Polygon

st.set_page_config(
    page_title="Route Review", 
    page_icon=":earth_africa:", 
    layout="wide",
    initial_sidebar_state="auto"
)

st.write("### Review Routes")

all_routes = glob(os.path.join("data/routes", '*.gpx'))
st.selectbox(
    "Select a route",
    all_routes,
    key="selected_route"
)

df, points = process_gpx_to_df(st.session_state["selected_route"])


# prepare coordinates
df['Latitude_Lag'] = df['Latitude'].shift(+1)
df['Latitude_Lag'].loc[0] = df['Latitude'].loc[0]
df['Longitude_Lag'] = df['Longitude'].shift(+1)
df['Longitude_Lag'].loc[0] = df['Longitude'].loc[0]

# smooth out altitude
# find a way to make the window adjusting to the variance of the graph
window = 5
df["Altitude_MA1"] = df["Altitude"].rolling(window).mean().fillna(df["Altitude"])
df["Altitude_MA2"] = df["Altitude"].rolling(window).mean().shift(-1*window+1).fillna(df["Altitude"])
df["Altitude_MA"] = (
    ((df["Altitude_MA1"] + df["Altitude_MA2"]) / 4) + 
    (df["Altitude"] / 2)
)

# further geometry features
curr_pos = list(zip(df.Latitude, df.Longitude))
last_pos = list(zip(df.Latitude_Lag, df.Longitude_Lag))
df["Distance"] = [
    geodesic(curr_pos[i], last_pos[i]).m
    for i in range(len(df))
]    
df['Cum_Distance'] = np.round(df['Distance'].cumsum(), 2)
df['Elevation_Diff'] = np.round(df['Altitude_MA'].diff().fillna(0), 2)
df['Cum_Elevation'] = np.round(df['Elevation_Diff'].cumsum(), 2)
df['Gradient'] = np.round(df['Elevation_Diff'] / df['Distance'] * 100, 1)
df['Gradient'] = df['Gradient'].fillna(0)

list_colors = [
    "#19a83d", # 0 gradient
    "#19a83d", # 1 gradient
    "#54a819", # 2 gradient
    "#54a819", # 3 gradient
    "#a89c19", # 4 gradient
    "#a89c19", # 5 gradient
    "#de5122", # 6 gradient
    "#de5122", # 7 gradient
    "#a83d19", # 8 gradient
    "#a83d19", # 9 gradient
    "#a81937", # 10 gradient
    "#a81937", # 11 gradient
    "#a81937", # 12 gradient
    "#FF1100", # 13 gradient
    "#FF1100", # 14 gradient
    "#FF1100", # 15 gradient
    "#260611", # 16+ gradient
]
color_dict = {i: list_colors[i] for i in range(len(list_colors))}


with st.expander("Data"):
    st.dataframe(df)

drawing_mode = st.toggle("draw")

# Plot the Map
m = folium.Map(
    location=[df.Latitude.mean(), df.Longitude.mean()], 
    zoom_start=11,
    tiles='OpenStreetMap',
)
# basic route track
fg = folium.FeatureGroup(name="Route", show=True).add_to(m)
folium.PolyLine(
    points,
    name="Route",
    color="blue", 
    weight=15, 
    opacity=.6
).add_to(fg)
# gravel section
if "gravel_section" not in st.session_state:
    st.session_state["gravel_section"] = []
if len(st.session_state["gravel_section"]) > 0:
    fg = folium.FeatureGroup(name="Gravel", show=True).add_to(m)
    for i, section in enumerate(st.session_state["gravel_section"]):
        folium.PolyLine(
            section,
            color="white", 
            weight=15, 
            opacity=.6
        ).add_to(fg)

# make a feature group
# min_gradient, max_graient = df["Gradient"].min(), df["Gradient"].max()
fg = folium.FeatureGroup(name="Gradient", show=True).add_to(m)
for i, r in df.iterrows():
    this_point = (r["Latitude"], r["Longitude"])
    next_point = (r["Latitude_Lag"], r["Longitude_Lag"])

    gradient = abs(r["Gradient"]) if abs(r["Gradient"]) < len(list_colors) else len(list_colors)-1
    picked_color=color_dict[int(gradient)]
    folium.PolyLine(
            [this_point, next_point],
            color=picked_color,
            weight=6,
            popup=folium.Popup(
                (
                    f"KM: {r['Cum_Distance']}<br>"
                    f"Elevation: {r['Altitude']}<br>"
                    f"Gradient: {r['Gradient']}<br>"
                ),
                max_width=400
            )            
        ).add_to(fg)


    # build a line from current to lag point
    # color it by speed
    # color it by gradient
    # color it by heart rate
    # color it by power output




# start marker
folium.vector_layers.CircleMarker(
    location=[df.iloc[0]['Latitude'], df.iloc[0]['Longitude']], 
    radius=15,
    color="white", 
    weight=2, 
    fill_color="green", 
    fill_opacity=1,
    popup=folium.Popup(
        f"Start of {st.session_state['selected_route']}",
        max_width=400
    )
).add_to(m)
folium.RegularPolygonMarker(
    location=[df.iloc[0]['Latitude'], df.iloc[0]['Longitude']], 
    fill_color="white", 
    fill_opacity=1, 
    color="white", 
    number_of_sides=3, 
    radius=8, 
    rotation=0, 
    popup=folium.Popup(
        f"Start of {st.session_state['selected_route']}",
        max_width=400
    )
).add_to(m)      
# finish marker
folium.vector_layers.CircleMarker(
    location=[df.iloc[-1]['Latitude'], df.iloc[-1]['Longitude']], 
    radius=15,
    color="white", 
    weight=2, 
    fill_color="red", 
    fill_opacity=1,
    popup=folium.Popup(
        f"End of {st.session_state['selected_route']}",
        max_width=400
    )
).add_to(m)
folium.RegularPolygonMarker(
    location=[df.iloc[-1]['Latitude'], df.iloc[-1]['Longitude']], 
    fill_color="white", 
    fill_opacity=1, 
    color="white", 
    number_of_sides=4, 
    radius=8, 
    rotation=45, 
    popup=folium.Popup(
        f"End of {st.session_state['selected_route']}",
        max_width=400
    )
).add_to(m)
folium.LayerControl().add_to(m)



# left, right = st.columns([3,1])
# with left:

if drawing_mode:
    Draw(export=True).add_to(m)
    map_data = st_folium(m, height=700, width=1000)
else:
    folium_static(m, height=700, width=1000)

# with right: 

if drawing_mode:
    if map_data["last_active_drawing"] is not None:
        drawing = Polygon(map_data["last_active_drawing"]["geometry"]["coordinates"][0])
        points_in_bound = [
            p for p in points if Point(p[1], p[0]).within(drawing)
        ]
        if st.button("Add gravel section"):
            st.session_state["gravel_section"] += [points_in_bound]
            st.rerun()

# st.write(st.session_state["gravel_section"])
st.line_chart(
    df, 
    x="Cum_Distance",
    y=[
        "Altitude",
        "Altitude_MA"
        ]
)
# st.slider(
#     "subset",
#     min_value=0.0,
#     max_value=df["Cum_Distance"].max(),
#     value=[0.0, df["Cum_Distance"].max()]
# )


# st.write(len(df))
# st.write(len(points))

import pandas as pd
if st.button("Export gravel"):
    flat_list = [
        x
        for xs in st.session_state["gravel_section"]
        for x in xs
    ]
    pd.DataFrame(flat_list).to_csv("data/routes/gravel_sections.csv")