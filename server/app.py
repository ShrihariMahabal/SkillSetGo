from flask import Flask, request, jsonify
from pymongo import MongoClient
import google.generativeai as genai
import pandas as pd
from bson.objectid import ObjectId
from bson.json_util import dumps
from bson.json_util import loads
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import math
from datetime import datetime, timedelta
import numpy as np
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from time import sleep
import re
import requests
from datetime import timedelta
from flask_socketio import SocketIO
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import math
from datetime import datetime, timedelta


app = Flask(__name__)
app.secret_key = 'sk'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

connection_string = 'mongodb+srv://shriharimahabal2:NObO44F5chwSglW7@cluster0.c0f3mdd.mongodb.net/'
client = MongoClient(connection_string)
db = client.get_database('ssg')

modelResp = ''
userResp = ''

def preprocess_data_mentors(df, role_column):
    df[role_column] = df[role_column].fillna('').str.lower().str.replace(' ', '_')
    return df
def sch(days_of_week, module_time, subtopics, subtopic_time, start_day):
    no_of_days = len(days_of_week) * module_time
    hours_day = sum(subtopic_time) / no_of_days
    schedule = []
    remaining_time = 0
    t = days_of_week.index(start_day)
    z = 0
    for subtopic in subtopic_time:
        t = t % len(days_of_week)
        if t == 0:
            schedule.append((subtopics[z], remaining_time / 60, days_of_week[-1]))
        else:
            schedule.append((subtopics[z], remaining_time / 60, days_of_week[t - 1]))

        no_of_days_sub = (subtopic - remaining_time) / hours_day
        extra_time = (subtopic - remaining_time) % hours_day
        remaining_time = hours_day - extra_time
        for i in range(math.ceil(no_of_days_sub) - 1):
            schedule.append((subtopics[z], hours_day / 60, days_of_week[t]))
            t = (t + 1) % len(days_of_week)
        schedule.append((subtopics[z], extra_time / 60, days_of_week[t]))
        t += 1
        z += 1

    return schedule[1:-1], days_of_week[t - 1]

def add_actual_dates(start_date, days_of_week, schedule):
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    day_name_to_index = {day: i for i, day in enumerate(days_of_week)}

    actual_schedule = []
    last_date = None

    for entry in schedule:
        topic, hours, day_name = entry
        target_weekday = day_name_to_index[day_name]
        if last_date and last_date.weekday() == target_weekday:
            current_date = last_date
        else:
            while current_date.weekday() != target_weekday:
                current_date += timedelta(days=1)

        actual_schedule.append((topic, hours, day_name, current_date.strftime("%Y-%m-%d")))
        last_date = current_date
        current_date += timedelta(days=1)

    return actual_schedule
def load_data():
    mentors = pd.read_csv('extended_mentors.csv')
    mentors = preprocess_data_mentors(mentors, 'current_position')
    
    # Combine relevant columns into 'combined_features'
    mentors['combined_features'] = mentors['current_position'] + ' ' + mentors['field_of_expertise']
    
    return mentors

def calculate_similarity_matrices(student_aimed_career_role, mentors):
    tfidf_vectorizer = TfidfVectorizer()
    mentor_features_matrix = tfidf_vectorizer.fit_transform(mentors['combined_features'])

    student_features = [student_aimed_career_role]
    student_features_matrix = tfidf_vectorizer.transform(student_features)

    cosine_similarities = linear_kernel(student_features_matrix, mentor_features_matrix)
    return cosine_similarities

def recommend_mentors_for_student(student_aimed_career_role, mentors, cosine_similarities, top_n=8):
    similarity_scores = list(enumerate(cosine_similarities[0]))
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
    top_mentor_indices = [i[0] for i in similarity_scores[:top_n]]
    return mentors.iloc[top_mentor_indices]

# Configure the Google Generative AI SDK
genai.configure(api_key="AIzaSyADLRDmiOintrh-0dZxZPOM0-QF2c4ks8g")

# Create the model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8000,
    "response_mime_type": "text/plain",
}

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    users = db.users
    users.insert_one(data)
    return jsonify({
        'message': 'User registered successfully'
    }), 200
    
@app.route('/login', methods=['POST'])
def login():
    users = db.users
    data = request.json
    email = data['email']
    password = data['password']
    user = users.find_one({
        'email': email,
        'password': password
    })
    if user:
        return jsonify({
            'message': 'User logged in successfully',
            'creds': {
                '_id': str(user['_id']),
                'username': user['username'],
                'email': user['email']
            }
        }), 200
    return jsonify({'message': 'Invalid credentials'}), 403

# @app.route('/inset_user_data', methods=['POST'])
# def insert_user_data():
#     data = request.json
#     userId = data['userId']
#     userData = db.userData
#     userData.insert_one(data)
#     return jsonify({
#         'message': 'User data inserted successfully'
#     }), 200

@app.route('/community_list/<string:userId>', methods=['GET'])
def get_community(userId):
    communities = db.communities
    communityList = list(communities.find({ 'memberIds': { '$nin': [userId] } }))
    memberCommunities = list(communities.find({'memberIds': userId}))
    owners = []
    memberOwners = []
    for community in communityList:
        community['_id'] = str(community['_id'])
        owner = db.users.find_one({'_id': ObjectId(community['adminId'])})
        owners.append(owner['username'])
    for community in memberCommunities:
        community['_id'] = str(community['_id'])
        owner = db.users.find_one({'_id': ObjectId(community['adminId'])})
        memberOwners.append(owner['username'])
    return jsonify({'communityList': communityList, 'memberCommunities': memberCommunities, 'owners': owners, 'memberOwners': memberOwners}), 200

@app.route('/create_community', methods=['POST'])
def create_community():
    data = request.json
    communities = db.communities
    communities.insert_one(data)
    return jsonify({
        'message': 'Community created successfully'
    }), 200
    
@app.route('/join_community', methods=['POST'])
def join_community():
    data = request.json
    communityId = ObjectId(data['communityId'])
    memberId = data['userId']
    communities = db.communities
    communities.update_one({'_id': communityId}, {"$addToSet": {'memberIds': memberId}})
    return jsonify({
        'message': 'User joined successfully'
    }), 200
    
@app.route('/create_doubt', methods=['POST'])
def create_doubt():
    data = request.json
    comment = {
        'communityId': data['communityId'],
        'commentHeading': data['commentHeading'],
        'commentContent': data['commentContent'],
        'commentorId': data['commentorId'],
        'likes': 0,
        'likedBy': [],
        'parentId': None,
        'reply': None
    }
    comments = db.comments
    comments.insert_one(comment)
    return jsonify({
        'message': 'Comment created successfully'
    }), 200

@app.route('/get_doubts/<string:community_id>/<string:user_id>', methods=['GET'])
def get_doubts(community_id, user_id):
    comments = db.comments
    users = db.users
    communities = db.communities
    video_data=db.videos
    module_data = video_data.find_one({'userId': user_id})

    if module_data:
        moduleName = module_data.get('module', '')
    isCompleted = module_data.get('isCompleted', [])
    subtopics = module_data.get('subtopics', [])
    most_recent_index = -1
    for i in range(len(isCompleted)):
        if isCompleted[i]:
            most_recent_index = i

    if most_recent_index >= 0 and most_recent_index < len(subtopics):
        subtopic_name = subtopics[most_recent_index]
    else:
        subtopic_name = ''

    communityData = communities.find_one({'_id': ObjectId(community_id)})
    communityData['_id'] = str(communityData['_id'])
    doubts = list(comments.find({'communityId': community_id, 'parentId': None}))
    commentors = []
    isLiked = []
    print(doubts)
    for doubt in doubts:
        doubt['_id'] = str(doubt['_id'])
        commentor = users.find_one({'_id': ObjectId(doubt['commentorId'])})
        if user_id in doubt['likedBy']:
            isLiked.append(True)
        else:
            isLiked.append(False)
        commentors.append(commentor['username'])
    top_recommendations = find_top_n_matching_communities('Web development', 'React JS', doubts, top_n=3)
    print("hi",top_recommendations)
    if doubts:
        return jsonify({'doubts': doubts, 'commentors': commentors, 'isLiked': isLiked, 'communityData': communityData,
            'top_recommendations': top_recommendations}), 200
    return jsonify({'message': 'No doubts found', 'communityData': communityData, 'doubts': [],'top_recommendations': []})

def find_top_n_matching_communities(module_name, subtopic_name, doubts, top_n=3):
    query = module_name + ' ' + subtopic_name
    doubt_headings = [doubt['commentHeading'] for doubt in doubts]
    print(doubt_headings)
    print("hi")
    vectorizer = TfidfVectorizer().fit_transform([query] + doubt_headings)
    vectors = vectorizer.toarray()
    cosine_similarities = cosine_similarity(vectors[0:1], vectors[1:]).flatten()
    top_n_indices = np.argsort(cosine_similarities)[-top_n:][::-1]

    recommendations = [doubts[index] for index in top_n_indices]
    return recommendations

@app.route('/like_doubt', methods=['POST'])
def like_doubt():           
    data = request.json
    comments = db.comments
    userId = data['userId']
    comment = comments.find_one({'_id': ObjectId(data['commentId'])})
    if data['like'] == True:
        comments.update_one({'_id': ObjectId(data['commentId'])}, {"$set": {'likes': comment['likes'] + 1}, "$addToSet": {'likedBy': userId}})
    else:
        comments.update_one({'_id': ObjectId(data['commentId'])}, {"$set": {'likes': comment['likes'] - 1}, "$pull": {'likedBy': userId}})
    return jsonify({
        'message': 'Like updated successfully'
    }), 200

@app.route('/answer_doubt', methods=['POST'])
def answer_doubt():
    data = request.json
    reply = data['reply']
    comment = {
        'communityId': data['communityId'],
        'commentHeading': data['commentHeading'],
        'commentContent': data['commentContent'],
        'commentorId': data['commentorId'],
        'likes': 0,
        'likedBy': [],
        'parentId': data['parentId'],
        'reply': reply
    }
    comments = db.comments
    comments.insert_one(comment)
    return jsonify({
        'message': 'Comment created successfully'
    }), 200


@app.route('/get_responses/<string:comment_id>/<string:user_id>', methods=['GET'])
def get_responses(comment_id, user_id):
    comments = db.comments
    users = db.users
    
    responses = list(comments.find({'parentId': comment_id}))
    parentComment = comments.find_one({'_id': ObjectId(comment_id)})
    parentComment['_id'] = str(parentComment['_id'])
    
    doubtAsker = users.find_one({'_id': ObjectId(parentComment['commentorId'])})
    doubtAsker = doubtAsker['username']
    
    if responses:
        responses.sort(key=lambda x: x['likes'], reverse=True)
        commentors = []
        isLiked = []
        repliedTo = []
        
        for response in responses:
            if response['reply']:
                repliedTo.append(users.find_one({'_id': ObjectId(response['reply'])})['username'])
                
            response['_id'] = str(response['_id'])
            commentor = users.find_one({'_id': ObjectId(response['commentorId'])})
            commentors.append(commentor['username'])
            
            if user_id in response.get('likedBy', []):
                isLiked.append(True)
            else:
                isLiked.append(False)
        
        return jsonify({
            'responses': responses,
            'commentors': commentors,
            'isLiked': isLiked,
            'parentComment': parentComment,
            'doubtAsker': doubtAsker,
            'repliedTo': repliedTo  # Include repliedTo here
        }), 200
    
    # If there are no responses
    return jsonify({
        'message': 'No responses found',
        'responses': [],
        'doubtAsker': doubtAsker,
        'parentComment': parentComment,
        'repliedTo': []  # Ensure repliedTo is initialized as an empty list
    }), 200

@app.route('/delete_comment/<string:comment_id>/', methods=['DELETE'])
def delete_comment(comment_id):
    comments = db.comments
    comments.delete_one({'_id': ObjectId(comment_id)})
    comments.delete_many({'parentId': comment_id})
    return jsonify({
        'message': 'Comment deleted successfully'
    }), 200

@app.route('/mentorship/<string:user_id>',methods=['GET'])
def mentor(user_id):
    accountInfo=db.userData
    account = accountInfo.find_one({'userId': user_id})
    if account:
        print(account['jobRole'])
    student_aimed_career_role = account['jobRole']
    mentors = load_data()
    cosine_similarities = calculate_similarity_matrices(student_aimed_career_role, mentors)
    recommended_mentors = recommend_mentors_for_student(student_aimed_career_role, mentors, cosine_similarities)
    recommended_mentors_json = recommended_mentors.to_dict('records')
    print(recommended_mentors_json)
    return jsonify(recommended_mentors_json)

def predictions(subtopic_times, difficulty_levels):
   
    data = pd.read_csv('Final_dataset_with_actual_time (1) (1).csv')

    X = data[['difficulty_level', 'duration_minutes']].values
    y = data['actual_time'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, random_state=42)

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f'Mean Absolute Error: {mae:.2f}')
    print(f'R-squared: {r2:.2f}')

    predicted_times = []
    for subtopic_time, difficulty_level in zip(subtopic_times, difficulty_levels):
        predicted_time = model.predict([[difficulty_level, subtopic_time]])
        predicted_times.append(predicted_time[0])

    return predicted_times


# @app.route('/get_schedule/<string:user_id>', methods=['GET'])
# def schedule(user_id):
#     video_data = db.videos
#     roadmap=db.roadmaps
#     roadmap_data = roadmap.find_one({'userId': user_id})
#     data1=roadmap_data['roadmap']['roadmap'][0]['module']


#     user_videos = list(video_data.find({'userId': user_id}).sort('progress', 1))
#     previous_progress = 1
#     data = {}
#     for video in user_videos:
#         if previous_progress == 1 and video['progress'] == 0:
#             video['_id'] = str(video['_id'])
#             data = video
#             break  
#         previous_progress = video['progress']
#     subtopic_data_diff=[]
#     subtopic_data=[]
#     weeks_duration=0
#     for i in range(len(roadmap_data['roadmap']['roadmap'])):
#         if roadmap_data['roadmap']['roadmap'][i]['module']==data['module']:
#             data2=roadmap_data['roadmap']['roadmap'][i]['subtopics']
#             weeks_duration=roadmap_data['roadmap']['roadmap'][i]['duration_weeks']
#             for i in range(len(data2)):
#                 subtopic_data.append(data2[i]['subtopic'])
#                 subtopic_data_diff.append(data2[i]['difficulty_level'])
#     video_data_dur=video_data.find({'module':data['module']})
#     print(video_data_dur[0]['video_data'])
    
    duration=[]
    for i in range(len(video_data_dur[0]['video_data'])):
        duration.append(video_data_dur[0]['video_data'][i][3])
    total_minutes = [int(h) * 60 + int(m) + int(s) / 60 for h, m, s in (time.split(':') for time in duration)]
    prediction=predictions(total_minutes,subtopic_data_diff)
    print(weeks_duration)
    print(subtopic_data)
    print(total_minutes)
    schedule, end_day = sch(['mon', 'wed', 'fri','sun'], weeks_duration, subtopic_data, total_minutes, 'wed')
    actual_schedule = add_actual_dates('2024-06-11', ['mon', 'wed', 'fri', 'sun'], schedule)
    actual_schedule = [[subtopic, duration, date] for subtopic, duration, day, date in actual_schedule]
    print(actual_schedule)
    return jsonify(actual_schedule)


mentors_df = pd.read_csv('extended_mentors.csv')
@app.route('/mentorship/<int:mentor_id>')
def get_mentor(mentor_id):
    mentor = mentors_df[mentors_df['id'] == mentor_id].to_dict(orient='records')
    print(mentor)
    if mentor:
        return jsonify(mentor[0]) 
    else:
        return jsonify({'error': 'Mentor not found'}), 404
    
@app.route('/assign_mentor', methods=['POST'])
def assign_mentor():
    data = request.json
    mentors = db.mentors
    mentors.insert_one(data['mentorDetails'])
    return jsonify({
        'message': 'Mentor assigned successfully'
    }), 200

# @app.route('/get_rating', methods=['POST'])
# def rating():
#     dataa = request.json
#     userId = dataa['userId'] 
#     tests = db.tests
#     users = db.users
#     videos = db.videos
#     roadmaps = db.roadmaps
#     user_test = tests.find_one({'userId': userId})
#     userData = db.userData
#     prev_rating = userData.find_one({'userId': userId})['rating']
#     test_score = user_test['score']
#     moduleID = user_test['moduleId']
#     user_test1 = videos.find_one({'_id': ObjectId(moduleID)})
#     roadmap = roadmaps.find_one({'userId': userId})
#     subtopic = roadmap['roadmap']['roadmap']
#     subtopic_diff = []

#     for i in range(len(subtopic)):
#         if subtopic[i]['module'] == user_test1['module']:
#             subtopics = subtopic[i]['subtopics']
#             for subtopic in subtopics:
#                 subtopic_diff.append(subtopic['difficulty_level'])

#     test_score = (test_score / 20) * 100

#     if prev_rating == 0:
#         new_rating = 0.7 * test_score + 0.3 * ((sum(subtopic_diff) / len(subtopic_diff)) * 10)
#     else:
#         new_rating = 0.3 * prev_rating + 0.5 * test_score + 0.2 * ((sum(subtopic_diff) / len(subtopic_diff)) * 10)
#     userData.update_one({'userId': userId}, {'$set': {'rating': new_rating}})

#     return jsonify({'new_rating': new_rating})

# @app.route('/extract_rating/<string:userId>', methods=['GET'])
# def extract_rating(userId):
#     userData = db.userData
#     rating = userData.find_one({'userId': userId})['rating']
#     return jsonify({'rating': rating})

@app.route('/get_mentor/<string:userId>', methods=['GET'])
def get_mentor_data(userId):
    mentors = db.mentors
    users = db.users
    mentor = mentors.find_one({'studentId': userId})
    username = users.find_one({'_id': ObjectId(userId)})['username']
    if mentor:
        mentor['_id'] = str(mentor['_id'])
        return jsonify({'mentor': mentor, 'username': username}), 200
    return jsonify({'message': 'No mentor found'})

@app.route('/chatbot', methods=['POST'])
def chatbot():
    model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    )
    
    chat_session = model.start_chat(history=request.json['history'])
    msg = request.json['message']
    response = chat_session.send_message(msg)
    text = response.text
    return text

@app.route('/make_roadmap', methods=['POST'])
def get_roadmap():
    data = request.json
    data['rating'] = 50
    roadmaps = db.roadmaps
    # prevRoadmap = db.prevRoadmap
    userData = db.userData
    userData.insert_one(data)
    model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    )
    current_date = data['currentDate']
    chat_session = model.start_chat(history=[])
    prompt = f"""
        User Inputs:

        Current Year of Engineering: {data['currentYear']}
        Desired Job Role: {data['jobRole']}
        Preferred Industry: {data['industry']}
        Technology Interests: {data['techInterests']}
        Career Aspirations: {data['aspirations']}
        Academic Background:
        Field of study: {data['curFieldOfStudy']}
        GPA: {data['gpa']}
        Academic achievements: {data['achievements']}
        Coursework:
        Relevant courses: {data['coursework']}
        Projects: {data['projects']}
        Time of Campus Placement: {data['placementTime']}
        Brief Description of Previous Experience and Knowledge: {data['prevExperience']}
        Length of Each Study Session: {data['studyDuration']}
        Roadmap Design Structure:
        Roadmap Design Structure:
        This roadmap is for an Indian student studying in an Indian engineering college. The roadmap generated should also take into consideration the other inputs provided by the user. Say, for example, the user has entered Finance as their preferred industry; then there should be a module dedicated to the application of the job role in that industry and how the learned modules are important in that field. Another example would be if the user entered their career aspirations as MNC, then the Interview prep module should be according to the interview setting of an MNC. Similarly, other input parameters of the user should also be considered.
        
        Next, the entered description of their previous experience should be analyzed, and all the topics that the user already knows but are to be included in the roadmap should be given less emphasis on, and the allotted time should be adjusted accordingly. It is crucial that every module will end with a project which would be a real-life application of all the subtopics covered in the entire module. It is also important that the last milestone/module of the roadmap would be the interview prep module, which would include important interview questions subtopics and everything relevant to the interview prep for the desired job role according to the Indian job placement environment.
        
        Now, each module will be designated a time, like it could be one week or two weeks, and this should be based on the subtopics in the module. It should take into account the frequency of the study sessions and the length of each study session entered by the user and then accordingly calculate a suitable time in weeks for each module. The last important thing is that the roadmap's total time should be such that it aligns with the campus placement time. It should be completed before the month of campus placement and should provide the user enough time to prepare for their placement. The time assigned to each module should be such that the total aligns with the time of campus placement starting from the day of the roadmap generation.
        
        The next thing is that for each subtopic you have to provide a detailed description for each subtopic which should contain details about what the subtopic should cover, all tech stack involved and its scope. The next thing is that for each subtopic provide links to relevant resources on the internet which cover the entire subtopic and all the relevant technologies and you should double check to ensure that all the links you provide are correctly working (sources for example can be various documentations, geeksforgeeks, tutorialspoint, scaler, programiz, etc. Don’t include links from medium.com and freecodecamp.com)
        
        The most important thing to take into account is that the roadmap should cover all the relevant tech stack and technologies for a given desired job role even if the user has done projects on a particular technology which is a part of that job role you should also include other relevant technologies in that domain. Say for example for a backend developer job role, the user has done a project on flask that does not mean that the whole roadmap should be flask based, it should also other technologies relevant to backend development like node and express.js. Similarly, for the other job roles relevant technologies should be added to the roadmap
        
        The current date is {current_date} so take into account this and the placement date and make the roadmap over this period which means the user has a lot of time so make the roadmap so that a variety of topics are covered
        
        JSON Format:
        The output should be a JSON object with the following structure, ensuring consistency across all outputs:
        
        {{
          "roadmap": [
            {{
              "module": "Module Name",
              "subtopics": [
                {{
                  "subtopic": "Subtopic1",
                  "difficulty_level": 1-10,
                  "description": "Detailed description and scope of the subtopic",
                  "links": ["link1", "link2"...]
                }},
                {{
                  "subtopic": "Subtopic2",
                  "difficulty_level": 1-10
                  "description": "Detailed description and scope of the subtopic",
                  "links": ["link1", "link2"...]
                }}
                ...
              ],
              "project": "Project Description",
              "duration_weeks": Number of Weeks
            }}
            ...
          ],
          "total_duration_weeks": Total Duration in Weeks,
          "completion_date": "Completion Date"
        }}
        Additional Notes:
        
        Ensure each module is specific and well-divided, avoiding overly broad or generic coverage.
        Take into account the user's previous experience and knowledge, giving less emphasis on topics the user is already familiar with.
        Align the total duration of the roadmap with the time of campus placement, ensuring the user is fully prepared by the start of the placement season.
        Another important thing to take care of is that the projects that you provide at the end of each module should not be generic like build a simple app or build a simple website etc. Instead, give the user a specific project like analyze the given dataset and train so-and-so model, build a calculator app with a UI description that you will give, or a proper case study of a company for EDA and model development etc.
        I want you to ensure and check before you give me any links as a majority of the previous links that you provided were not working. This should strictly not happen because this will cause major issue in the learning. Keep in mind that you give functioning and proper links only
        
        Your task is to generate a personalized roadmap for the user based on the provided inputs. The roadmap structure and modules should be according to the given roadmap structure design. The final output should be in the given JSON format and should only contain the JSON object and nothing else.
    """
    
    response = chat_session.send_message(prompt)
    
    # responseAnalysis_text = responseAnalysis.text
    try:
        # Remove the "```json" and "```" markers from the response text
        cleaned_response_text = response.text.strip().strip("```json").strip("```")
        global modelResp
        modelResp = cleaned_response_text
        
        global userResp
        userResp = prompt
        
        # Parse the cleaned response text to a JSON object
        roadmap_json = json.loads(cleaned_response_text)
        
        # Insert the JSON object into the 'roadmaps' collection
        roadmaps.insert_one({'userId': data['userId'], 'roadmap': roadmap_json})
        
        return jsonify({'response': roadmap_json,'message': 'Roadmap generated and stored successfully'}), 200
    except json.JSONDecodeError:
        return jsonify({'message': 'Failed to decode JSON from response'}), 500
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    
@app.route('/change_roadmap', methods=['POST'])
def change_roadmap():
    data = request.json
    roadmaps = db.roadmaps
    userData = db.userData
    userData.update_one({'userId': data['userId']}, {'$set': data})
    model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    )
    current_date = data['currentDate']
    chat_session = model.start_chat(history=[])
    prompt = f"""
	User Inputs:
    I previously asked you this:
    {userResp}
    For this question, you answered:
    {modelResp}
	Current Year of Engineering: {data['currentYear']}
	Desired Job Role: {data['jobRole']}
	Preferred Industry: {data['industry']}
    Technology Interests: {data['techInterests']}
	Career Aspirations: {data['aspirations']}
    Academic Background:
    Field of study: {data['curFieldOfStudy']}
    GPA: {data['gpa']}
    Academic achievements: {data['achievements']}
    Coursework:
    Relevant courses: {data['coursework']}
    Projects: {data['projects']}
    Time of Campus Placement: {data['placementTime']}
    Brief Description of Previous Experience and Knowledge: {data['prevExperience']}
    Length of Each Study Session: {data['studyDuration']}
	Current Date: {data['currentDate']}
	User's current state and wishes: {data['academicSituation']}
	
	The user has now changed his career goals and preferences. Take into account the above changes and the User's current state and wishes and suggest a new roadmap to follow this. This time it is not necessary that the user wants to pursue a tech role. There may be cases where the user may have come across new career opportunities and want to pursue a non-tech role so accordingly suggest a career path based on the user's wishes and new set of inputs. If the user has opted for non-tech roles then there may not be a need to add the project section in each module so remove that from the output. If the role is a tech role then keep the output format as is. Make sure that the output only contains the new roadmap in json and nothing else.
	"""
    response = chat_session.send_message(prompt)
    try:
        # Remove the "```json" and "```" markers from the response text
        cleaned_response_text = response.text.strip().strip("```json").strip("```")
        
        # Parse the cleaned response text to a JSON object
        roadmap_json = json.loads(cleaned_response_text)
        
        # Insert the JSON object into the 'roadmaps' collection
        roadmaps.update_one({'userId': data['userId']}, {'$set': {'roadmap': roadmap_json}})     
        mentors=db.mentors
        mentors.delete_one({'studentId': data['userId']})  
        videos=db.videos
        videos.delete_many({'userId': data['userId']})
        return jsonify({'response': roadmap_json, 'message': 'Roadmap generated and changed successfully'}), 200
    except json.JSONDecodeError:
        return jsonify({'message': 'Failed to decode JSON from response'}), 500
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    
    
# @app.route('/generate_analysis', methods=['POST'])
# def generate_analysis():
#     data = request.json
#     model = genai.GenerativeModel(
#     model_name="gemini-1.5-pro",
#     generation_config=generation_config,
#     )
#     current_date = data['currentDate']
#     chat_session = model.start_chat(history=[])
    
#     prompt = f"""
#         User Inputs:

#         Current Year of Engineering: {data['currentYear']}
#         Desired Job Role: {data['jobRole']}
#         Preferred Industry: {data['industry']}
#         Technology Interests: {data['techInterests']}
#         Career Aspirations: {data['aspirations']}
#         Academic Background:
#         Field of study: {data['curFieldOfStudy']}
#         GPA: {data['gpa']}
#         Academic achievements: {data['achievements']}
#         Coursework:
#         Relevant courses: {data['coursework']}
#         Projects: {data['projects']}
#         Time of Campus Placement: {data['placementTime']}
#         Brief Description of Previous Experience and Knowledge: {data['prevExperience']}
#         The following are the user inputs of an Indian engineering student studying in an Indian engineering college.
# 	Compare the user's skills and knowledge to the requirements and expectations of their dream role to identify skill gaps and areas for improvement and then provide a detailed analysis of what the user lacks and atleast give 500 words.
# 	Make sure that you don't give any action plan and address the user in first person only. Also give the answer in text format only no tables.
#     """
	
#     response = chat_session.send_message(prompt)
    
@app.route('/analysis', methods=['POST'])
def analysis():
    data = request.json
    model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    )
    current_date = data['currentDate']
    chat_session = model.start_chat(history=[])
    prompt1 = f"""
        User Inputs:

        Current Year of Engineering: {data['currentYear']}
        Desired Job Role: {data['jobRole']}
        Preferred Industry: {data['industry']}
        Technology Interests: {data['techInterests']}
        Career Aspirations: {data['aspirations']}
        Academic Background:
        Field of study: {data['curFieldOfStudy']}
        GPA: {data['gpa']}
        Academic achievements: {data['achievements']}
        Coursework:
        Relevant courses: {data['coursework']}
        Projects: {data['projects']}
        Time of Campus Placement: {data['placementTime']}
        Brief Description of Previous Experience and Knowledge: {data['prevExperience']}
        Base on this information first of all counsel the student on the placement timing that if they will actually be able to prepare for the role in the stipulated amount of time considering that today is {current_date}.
	
	1. The case is that if the placement date has already passed i.e. the placement date occurs before today's date {current_date} but only if this happens then you have to specifically start the output sentence with the words Invalid Date and then advise the user they should try out for the next placement season. The current date is {current_date} and placement date is {data['placementTime']}. Also don't give any ways as to how the user can pursue their desired role in the future as it will be done later on by so you don't even need to mention it. Also don't be diplomatic in giving your answers if you think it is not feasible then just say so
	
	2. The user's field of study is {data['curFieldOfStudy']}. If this field of study is anything unrelated to engineering then advise the user that since they are from a completely unrelated Field of Study they should pursue a more relevant career path to their area of study. Also don't give any ways as to how the user can pursue their desired role in the future as it will be done later on by another app so you don't have to mention it. Start the output with Unrelated Job Role compulsorily. Also don't be diplomatic in giving your answers if you think it is not feasible then just say so. Check for this case very carefully as this can be easy to miss, check twice for it.
	
	3. The next case is if the placement date is after the current date but is so close to today that getting adequately prepared for the desired job role based on the student's current state is not feasible then start the output with the words Insufficient Time then advise the user that it is not really feasible to be well prepared for their desired role by their placement date and also give a few reasons as to why it is not possible. Also don't give any ways as to how the user can pursue their desired role in the future as it will be done later on by another app so you don't even need to mention it. Also don't be diplomatic in giving your answers if you think it is not feasible then just say so
	
	4. If the student can achieve the desired job role till placement that they can prepare for the placement with adequate hard work and practice. Appreciate the user saying that they can achieve their goal by working dedicatedly
	
	A student can only fit one of the above 4 cases not more than one so figure out the most relevant one after examining each and every case for that student info thoroughly and give the output according to that case 
        """
        
    response = chat_session.send_message(prompt1)
    response_text = response.text
    
    if response_text.startswith('Invalid Date'):
        return jsonify({'message': 'Invalid Date, Try for the next placement season'})
    elif response_text.startswith('Unrelated Job Role'):
        return jsonify({'message': 'Unrelated Job Role, Pursue a more relevant career path to your area of study'})
    elif response_text.startswith('Insufficient Time'):
        return jsonify({'message': 'Insufficient Time, Not feasible to be well prepared for your desired role by your placement date'})
    else:
        prompt = f"""
        User Inputs:

        Current Year of Engineering: {data['currentYear']}
        Desired Job Role: {data['jobRole']}
        Preferred Industry: {data['industry']}
        Technology Interests: {data['techInterests']}
        Career Aspirations: {data['aspirations']}
        Academic Background:
        Field of study: {data['curFieldOfStudy']}
        GPA: {data['gpa']}
        Academic achievements: {data['achievements']}
        Coursework:
        Relevant courses: {data['coursework']}
        Projects: {data['projects']}
        Time of Campus Placement: {data['placementTime']}
        Brief Description of Previous Experience and Knowledge: {data['prevExperience']}
        
        The following are the user inputs of an Indian engineering student studying in an Indian engineering college.
        Compare the user's skills and knowledge to the requirements and expectations of their dream role to identify skill gaps and areas for improvement and then provide a detailed analysis of what the user lacks and atleast give 400 words.
        Make sure that you don't give any action plan. Also give the answer in text format only no tables.
        """
        response1 = chat_session.send_message(prompt)
        response1_text = response1.text

        responseAnalysis = chat_session.send_message(prompt)
        return jsonify({'message': responseAnalysis.text}), 200
        
    
@app.route('/get_roadmap/<string:user_id>', methods=['GET'])
def get_roadmap_data(user_id):
    roadmaps = db.roadmaps
    roadmap = roadmaps.find_one({'userId': user_id})
    if roadmap:
        roadmap['_id'] = str(roadmap['_id'])
        return jsonify(roadmap), 200
    return jsonify({'message': 'No roadmap found'}), 404

@app.route('/get_todo_list/<string:user_id>',methods = ['GET'])
def get_todo(user_id):
    todos = db.todos
    todoList = list(todos.find({'userId':user_id}))
    print(todoList)
    for todo in todoList:
        todo["_id"]=str(todo["_id"])
    return jsonify({"todoList": todoList})   

@app.route('/add_todo',methods = ['POST'])
def add_todo():
    data = request.json
    todos = db.todos
    todos.insert_one(data)
    return jsonify({"message":"Todo added successfully"})


#videos part
api_key = "AIzaSyADMU6l1-W3zUyS2NkTlZeppiPJ8A82zJ0"
model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
)

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--ignore-certificate-errors')

driver = webdriver.Chrome(options=options)

def check_query(module, subtopic):
    prompt = f"""
    {subtopic} is a subtopic of the course {module}. Will searching just the subtopic name through youtube yield an appropriate result or should I add the course name to the subtopic in the search. Give me a yes or no answer only. 0 is no 1 is yes
    """
    flag = model.generate_content(prompt)
    return int(flag.text.strip())

def retrieve_videos(search_query):
    driver.get("https://www.youtube.com")
    search_box = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'input#search'))
    )
    search_box.send_keys(search_query)
    search_box.submit()
    sleep(3)
    videos = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'a#video-title'))
    )
    video_links = [video.get_attribute('href') for video in videos]
    return video_links

def get_video_id(youtube_url):
    video_id = re.search(r"(?<=v=)[^&]+", youtube_url)
    if not video_id:
        video_id = re.search(r"(?<=be/)[^&]+", youtube_url)
    return video_id.group(0) if video_id else None

def get_video_duration(api_key, video_id):
    url = f"https://www.googleapis.com/youtube/v3/videos?id={video_id}&part=contentDetails&key={api_key}"
    response = requests.get(url).json()
    duration = response['items'][0]['contentDetails']['duration']
    return parse_duration(duration)

def parse_duration(duration):
    match = re.match(r'PT((?P<hours>\d+)H)?((?P<minutes>\d+)M)?((?P<seconds>\d+)S)?', duration)
    if not match:
        return None
    parts = match.groupdict()
    time_params = {name: int(param) for name, param in parts.items() if param}
    return timedelta(**time_params)

@app.route('/get_video', methods=['POST'])
def main():
    data = request.json
    userId = data['userId']
    module = data['module']
    subtopics = data['subtopics']

    # Check if videos for this module and user already exist
    existing_videos = db.videos.find_one({'userId': userId, 'module': module})
    if existing_videos:
        return jsonify({'message': 'Videos for this module have already been generated'}), 200

    video_data = []
    for subtopic in subtopics:
        flag = check_query(module, subtopic)
        if flag == 0:
            video_links = retrieve_videos(module + " " + subtopic)
        else:
            video_links = retrieve_videos(subtopic)

        suitable_video = None
        longest_video = None
        longest_duration = timedelta(0)

        for video_link in video_links:
            video_id = get_video_id(video_link)
            if video_id:
                duration = get_video_duration(api_key, video_id)
                if duration:
                    if duration > timedelta(minutes=50):
                        suitable_video = (module, subtopic, video_link, str(duration))
                        break
                    if duration > longest_duration:
                        longest_video = (module, subtopic, video_link, str(duration))
                        longest_duration = duration

        if suitable_video:
            video_data.append(suitable_video)
        elif longest_video:
            video_data.append(longest_video)
        else:
            return jsonify({'message': 'No suitable video found'}), 404

    isCompleted = [False] * len(subtopics)
    videos = db.videos
    videos.insert_one({
        'userId': userId,
        'module': module,
        'subtopics': subtopics,
        'video_data': video_data,
        'isCompleted': isCompleted,
        'progress': 0
    })
    return jsonify({'message': 'Videos retrieved and stored successfully'}), 200

# @app.route('/get_next_module/<string:userId>', methods=['GET'])


@app.route('/fetch_modules/<string:user_id>', methods=['GET'])
def fetch_videos(user_id):
    videos = db.videos
    videoData = list(videos.find({'userId': user_id}))
    if videoData:
        for video in videoData:
            video['_id'] = str(video['_id'])
        return jsonify({'videos': videoData}), 200
    return jsonify({'message': 'No video data found'}), 404

@app.route('/get_subtopics/<string:moduleId>/<string:userId>', methods=['GET'])
def get_subtopics(moduleId, userId):
    videos = db.videos
    subtopics = videos.find_one({'_id': ObjectId(moduleId)})
    if subtopics:
        subtopics['_id'] = str(subtopics['_id'])
        return jsonify({'subtopics': subtopics}), 200
    return jsonify({'message': 'No subtopic found'}), 404

@app.route('/get_vids/<string:moduleId>/<string:userId>/<string:subtopicIndex>', methods=['GET'])
def get_vids(moduleId, userId, subtopicIndex):
    videos = db.videos
    moduleName = videos.find_one({'_id': ObjectId(moduleId)})['module']
    roadmaps = db.roadmaps
    rm = roadmaps.find_one({'userId': userId})
    modules = rm['roadmap']['roadmap']
    moduleMain1 = None
    for i in modules:
        if i['module'] == moduleName:
            moduleMain1 = i
            break
    moduleMain = moduleMain1['subtopics'][int(subtopicIndex)]
    subtopics = videos.find_one({'_id': ObjectId(moduleId)})
    if subtopics:
        subtopics['_id'] = str(subtopics['_id'])
        return jsonify({'subtopics': subtopics, 'moduleMain': moduleMain}), 200
    return jsonify({'message': 'No subtopic found'}), 404

@app.route('/get_quiz', methods=['POST'])
def get_quiz():
    data = request.json
    moduleId = data['moduleId']
    userId = data['userId']
    videos = db.videos
    mods = videos.find_one({'_id': ObjectId(moduleId)})
    module = mods['module']
    subtopics = mods['subtopics']

    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro",
        generation_config=generation_config,
    )
    chat_session = model.start_chat(history=[])
    prompt = f"""
    I have completed the course of {module} which had the following subtopics {subtopics}. 
    I want you to generate a quiz for this course so that I can strengthen my understanding of the topic. 
    The number of questions should be 20 with increasing difficulty of the questions and they should be mcq type questions. 
    Also keep in mind that you don't give basic questions. 
    They are for an engineering student studying these topics so give questions accordingly.

    The quiz should be given to me in the following json format:

    {{
        "questions": [
            {{
                "question": "question 1 for the quiz",
                "option_a": "potential answer a",
                "option_b": "potential answer a",
                "option_c": "potential answer a",
                "option_d": "potential answer a",
                "correct_answer": "a, b, c or d"
            }},
            {{
                "question": "question 2 for the quiz",
                "option_a": "potential answer a",
                "option_b": "potential answer a",
                "option_c": "potential answer a",
                "option_d": "potential answer a",
                "correct_answer": "a, b, c or d"
            }},
            ...
        ]
    }}
    Make sure that the output contains only this json object
    """

    response = chat_session.send_message(prompt)

    try:
        # Remove the "```json" and "```" markers from the response text
        cleaned_response_text = response.text.strip().strip("```json").strip("```")

        # Parse the cleaned response text to a JSON object
        quiz_json = json.loads(cleaned_response_text)

        # Insert the JSON object into the 'tests' collection
        tests = db.tests

        # Check if a quiz for this user and module already exists
        existing_quiz = tests.find_one({'moduleId': moduleId, 'userId': userId})
        if existing_quiz:
            return jsonify({'response': existing_quiz['quiz'], 'message': 'Quiz already exists'}), 200

        tests.insert_one({'moduleId': moduleId, 'quiz': quiz_json, 'userId': userId, 'score': 0})

        return jsonify({'response': quiz_json, 'message': 'Quiz generated successfully'}), 200
    except json.JSONDecodeError:
        return jsonify({'message': 'Failed to decode JSON from response'}), 500
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/submit_quiz', methods=['POST'])
def submit_quiz():
    score = 0
    data = request.json
    moduleId = data['moduleId']
    userId = data['userId']
    answers = data['answers']
    
    tests = db.tests
    test = tests.find_one({'moduleId': moduleId, 'userId': userId})
    correct_answers = test['quiz']['questions']
    
    # Logging for debugging
    print("User Answers:", answers)
    print("Correct Answers:", [q['correct_answer'] for q in correct_answers])
    
    for index, question in enumerate(correct_answers):
        correct_answer = question['correct_answer'].strip().lower()
        user_answer = answers[index].strip().lower()
        
        # Log each comparison
        print(f"Comparing: Correct Answer: {correct_answer}, User Answer: {user_answer}")
        
        if correct_answer == user_answer:
            score += 1
    
    tests.update_one({'moduleId': moduleId, 'userId': userId}, {'$set': {'score': score}})
    
    return jsonify({'message': 'Quiz submitted successfully', 'score': score}), 200


@app.route('/complete_subtopic', methods=['POST'])
def complete_subtopic():
    data = request.json
    videos = db.videos
    moduleId = data['moduleId']
    subtopicIndex = data['subtopicIndex']
    length = data['length']
    val = 1 / float(length)
    videos.update_one({'_id': ObjectId(moduleId)}, {
        "$set": {f'isCompleted.{subtopicIndex}': True},
        "$inc": {'progress': val}
    })
    return jsonify({'message': 'Subtopic completed successfully'}), 200

@app.route('/not_complete_subtopic', methods=['POST'])
def not_complete_subtopic():
    data = request.json
    videos = db.videos
    moduleId = data['moduleId']
    subtopicIndex = data['subtopicIndex']
    length = data['length']
    val = 1 / float(length)
    videos.update_one({'_id': ObjectId(moduleId)}, {
        "$set": {f'isCompleted.{subtopicIndex}': False},
        "$inc": {'progress': -val}
    })
    return jsonify({'message': 'Subtopic not completed successfully'}), 200

@app.route('/get_schedule/<string:user_id>', methods=['GET'])
def schedule(user_id):
    video_data = db.videos
    roadmap=db.roadmaps
    roadmap_data = roadmap.find_one({'userId': user_id})
    data1=roadmap_data['roadmap']['roadmap'][0]['module']
    print(data1)
    user_videos = list(video_data.find({'userId': user_id}).sort('progress', 1))
    print(user_videos)
    previous_progress = 1
    data = {}
    for video in user_videos:
        if previous_progress == 1 and video['progress'] == 0:
            video['_id'] = str(video['_id'])
            data = video
            break  
        previous_progress = video['progress']
    print(data)
    subtopic_data_diff=[]
    subtopic_data=[]
    weeks_duration=0
    for i in range(len(roadmap_data['roadmap']['roadmap'])):
        if roadmap_data['roadmap']['roadmap'][i]['module']==data1:
            data2=roadmap_data['roadmap']['roadmap'][i]['subtopics']
            weeks_duration=roadmap_data['roadmap']['roadmap'][i]['duration_weeks']
            for i in range(len(data2)):
                subtopic_data.append(data2[i]['subtopic'])
                subtopic_data_diff.append(data2[i]['difficulty_level'])
    video_data_dur=video_data.find({'module':data['module']})
    print(video_data_dur[0]['video_data'])
    
    duration=[]
    for i in range(len(video_data_dur[0]['video_data'])):
        duration.append(video_data_dur[0]['video_data'][i][3])
    total_minutes = [int(h) * 60 + int(m) + int(s) / 60 for h, m, s in (time.split(':') for time in duration)]
    prediction=predictions(total_minutes,subtopic_data_diff)
    print(subtopic_data_diff)
    print(weeks_duration)
    print(subtopic_data)
    print(total_minutes)
    schedule, end_day = sch(['mon', 'wed', 'fri','sun'], weeks_duration, subtopic_data, total_minutes, 'wed')
    actual_schedule = add_actual_dates('2024-06-23', ['mon', 'wed', 'fri', 'sun'], schedule)
    actual_schedule = [[subtopic, duration, date] for subtopic, duration, day, date in actual_schedule]
    print(actual_schedule)
    return jsonify(actual_schedule)
def get_job_data(job_role: str, city: str) -> list[dict]:
    """
    Generate dummy job data for testing and static analysis validation.

    Args:
        job_role (str): The job title or role to simulate.
        city (str): The city where the job is located.

    Returns:
        list[dict]: A list of dictionaries containing dummy job entries.
    """
    if not job_role or not city:
        raise ValueError("Job role and city must not be empty.")

    job_jobs = []
    for i in range(5):
        job = {
            "title": f"{job_role} {i+1}",
            "company": f"Company {chr(65 + i)}",
            "location": city,
            "link": f"https://example.com/job/{i+1}"
        }
        job_jobs.append(job)

    return job_jobs

def sch(days_of_week, module_time, subtopics, subtopic_time, start_day):
    print(len(days_of_week),module_time)
    no_of_days = len(days_of_week) * module_time
    print(no_of_days)
    hours_day = sum(subtopic_time) / no_of_days
    schedule = []
    remaining_time = 0
    t = days_of_week.index(start_day)
    z = 0
    for subtopic in subtopic_time:
        t = t % len(days_of_week)
        if t == 0:
            schedule.append((subtopics[z], remaining_time / 60, days_of_week[-1]))
        else:
            schedule.append((subtopics[z], remaining_time / 60, days_of_week[t - 1]))

        no_of_days_sub = (subtopic - remaining_time) / hours_day
        extra_time = (subtopic - remaining_time) % hours_day
        remaining_time = hours_day - extra_time
        for i in range(math.ceil(no_of_days_sub) - 1):
            schedule.append((subtopics[z], hours_day / 60, days_of_week[t]))
            t = (t + 1) % len(days_of_week)
        schedule.append((subtopics[z], extra_time / 60, days_of_week[t]))
        t += 1
        z += 1

    return schedule[1:-1], days_of_week[t - 1]

def add_actual_dates(start_date, days_of_week, schedule):
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    day_name_to_index = {day: i for i, day in enumerate(days_of_week)}

    actual_schedule = []
    last_date = None

    for entry in schedule:
        topic, hours, day_name = entry
        target_weekday = day_name_to_index[day_name]
        if last_date and last_date.weekday() == target_weekday:
            current_date = last_date
        else:
            while current_date.weekday() != target_weekday:
                current_date += timedelta(days=1)

        actual_schedule.append((topic, hours, day_name, current_date.strftime("%Y-%m-%d")))
        last_date = current_date
        current_date += timedelta(days=1)

    return actual_schedule


def predictions(subtopic_times, difficulty_levels):
   
    data = pd.read_csv('Final_dataset_with_actual_time (1) (1).csv')

    X = data[['difficulty_level', 'duration_minutes']].values
    y = data['actual_time'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, random_state=42)

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f'Mean Absolute Error: {mae:.2f}')
    print(f'R-squared: {r2:.2f}')

    predicted_times = []
    for subtopic_time, difficulty_level in zip(subtopic_times, difficulty_levels):
        predicted_time = model.predict([[difficulty_level, subtopic_time]])
        predicted_times.append(predicted_time[0])

    return predicted_times

def scrape_indeed(job_title, location):
    # Initialize the WebDriver
    options = Options()
    options.add_argument('--headless')
    driver = webdriver.Chrome()
    try:
        # Construct the search URL
        url = f"https://in.indeed.com/jobs?q={job_title.replace(' ', '+')}&l={location.replace(' ', '+')}&from=searchOnHP"
        #url = f"https://www.naukri.com/{job_title.replace(' ', '-')}-jobs-in-{location.replace(' ', '-')}"
        print(url)
        driver.get(url)

        # Wait until job listings are loaded
        job_cards = WebDriverWait(driver, 30).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'div.job_seen_beacon'))
        )

        jobs = []

        # Loop through job cards and extract required information
        for card in job_cards:
            try:
                title_element = card.find_element(By.CSS_SELECTOR, '.jcs-JobTitle.css-jspxzf.eu4oa1w0')
                title = title_element.text
                link = title_element.get_attribute('href')

                company = card.find_element(By.CSS_SELECTOR, '.css-1qv0295.e37uo190').text
                location = card.find_element(By.CSS_SELECTOR, '.css-1p0sjhy.eu4oa1w0').text

                job = {
                    'title': title,
                    'company': company,
                    'location': location,
                    'link': link
                }
                jobs.append(job)
            except Exception as e:
                print(f"Error extracting data from job card: {e}")

        return jobs

    except TimeoutException as ex:
        print(f"Timeout waiting for job listings: {ex}")
        return []  # Return empty list if timeout occurs

    finally:
        driver.quit()  # Close the browser


def display_jobs(job, location):
    # Run the scraping function and print the results
    jobs = scrape_indeed(job, location)
    max_jobs = 10 if len(jobs) > 10 else len(jobs)
    return jobs[:max_jobs]


def display_internships(job, location):
    jobs = scrape_indeed(f'{job} Intern', location)
    max_jobs = 10 if len(jobs) > 10 else len(jobs)
    return jobs[:max_jobs]

@app.route('/job_listing', methods=['GET'])
def job_listing():
    user=db.users
    internships=display_internships('Web Developer', 'Mumbai, Maharashtra')
    jobs=display_jobs('Web Developer', 'Mumbai, Maharashtra')
    return jsonify({'internships':internships,'jobs':jobs})

@app.route('/account/<string:user_id>',methods = ['GET'])
def account_info(user_id):
    accountInfo=db.userData
    account = accountInfo.find_one({'userId': user_id})
    if account:
        print(account)
        account['_id'] = str(account['_id'])
        return jsonify({'Account': account}), 200
    
    return jsonify({'message': 'No acount data found'}), 404

if __name__ == '__main__':
    app.run(debug=True)