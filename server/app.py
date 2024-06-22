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

import math
from datetime import datetime, timedelta

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from time import sleep
import re
import requests
from datetime import timedelta
from flask_socketio import SocketIO

app = Flask(__name__)
app.secret_key = 'sk'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

connection_string = 'mongodb+srv://shriharimahabal2:NObO44F5chwSglW7@cluster0.c0f3mdd.mongodb.net/'
client = MongoClient(connection_string)
db = client.get_database('ssg')

# modelResp = ''
# userResp = ''

def preprocess_data_mentors(df, role_column):
    df[role_column] = df[role_column].fillna('').str.lower().str.replace(' ', '_')
    return df

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
    communityData = communities.find_one({'_id': ObjectId(community_id)})
    communityData['_id'] = str(communityData['_id'])
    doubts = list(comments.find({'communityId': community_id, 'parentId': None}))
    commentors = []
    isLiked = []
    for doubt in doubts:
        doubt['_id'] = str(doubt['_id'])
        commentor = users.find_one({'_id': ObjectId(doubt['commentorId'])})
        if user_id in doubt['likedBy']:
            isLiked.append(True)
        else:
            isLiked.append(False)
        commentors.append(commentor['username'])
    if doubts:
        return jsonify({'doubts': doubts, 'commentors': commentors, 'isLiked': isLiked, 'communityData': communityData}), 200
    return jsonify({'message': 'No doubts found', 'communityData': communityData, 'doubts': []})

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
    try:
        # Remove the "```json" and "```" markers from the response text
        cleaned_response_text = response.text.strip().strip("```json").strip("```")
        modelResp = response
        userResp = prompt
        
        # Parse the cleaned response text to a JSON object
        roadmap_json = json.loads(cleaned_response_text)
        
        # Insert the JSON object into the 'roadmaps' collection
        roadmaps.insert_one({'userId': data['userId'], 'roadmap': roadmap_json})
        
        return jsonify({'response': roadmap_json, 'message': 'Roadmap generated and stored successfully'}), 200
    except json.JSONDecodeError:
        return jsonify({'message': 'Failed to decode JSON from response'}), 500
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    
# @app.route('/change_roadmap', methods=['POST'])
# def change_roadmap():
#     data = request.json
#     roadmaps = db.roadmaps
#     userData = db.userData
#     userData.update_one({'userId': data['userId']}, {'$set': data})
#     model = genai.GenerativeModel(
#     model_name="gemini-1.5-pro",
#     generation_config=generation_config,
#     )
#     current_date = data['currentDate']
#     chat_session = model.start_chat(history=[])
#     prompt = f"""
# 	User Inputs:
#     I previously asked you this:
#     {user}
#     For this question, you answered:
#     {model}
# 	Current Year of Engineering: {data['currentYear']}
# 	Desired Job Role: {data['jobRole']}
# 	Preferred Industry: {data['industry']}
#     Technology Interests: {data['techInterests']}
# 	Career Aspirations: {data['aspirations']}
#     Academic Background:
#     Field of study: {data['curFieldOfStudy']}
#     GPA: {data['gpa']}
#     Academic achievements: {data['achievements']}
#     Coursework:
#     Relevant courses: {data['coursework']}
#     Projects: {data['projects']}
#     Time of Campus Placement: {data['placementTime']}
#     Brief Description of Previous Experience and Knowledge: {data['prevExperience']}
#     Length of Each Study Session: {data['studyDuration']}
# 	Current Date: {data['currentDate']}
# 	User's current state and wishes: {data['academicSituation']}
	
# 	The user has now changed his career goals and preferences. Take into account the above changes and the User's current state and wishes and suggest a new roadmap to follow this. This time it is not necessary that the user wants to pursue a tech role. There may be cases where the user may have come across new career opportunities and want to pursue a non-tech role so accordingly suggest a career path based on the user's wishes and new set of inputs. If the user has opted for non-tech roles then there may not be a need to add the project section in each module so remove that from the output. If the role is a tech role then keep the output format as is. Make sure that the output only contains the new roadmap in json and nothing else.
# 	"""
#     response = chat_session.send_message(prompt)
#     try:
#         # Remove the "```json" and "```" markers from the response text
#         cleaned_response_text = response.text.strip().strip("```json").strip("```")
        
#         # Parse the cleaned response text to a JSON object
#         roadmap_json = json.loads(cleaned_response_text)
        
#         # Insert the JSON object into the 'roadmaps' collection
#         roadmaps.update_one({'userId': data['userId']}, {'$set': {'roadmap': roadmap_json}})     
#         mentors=db.mentors
#         mentors.delete_one({'studentId': data['userId']})  
#         videos=db.videos
#         videos.delete_one({'userId': data['userId']})
#         return jsonify({'response': roadmap_json, 'message': 'Roadmap generated and changed successfully'}), 200
#     except json.JSONDecodeError:
#         return jsonify({'message': 'Failed to decode JSON from response'}), 500
#     except Exception as e:
#         return jsonify({'message': str(e)}), 500
    
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

@app.route('/account/<string:user_id>',methods = ['GET'])
def account_info(user_id):
    accountInfo=db.userData
    account = accountInfo.find_one({'userId': user_id})
    if account:
        print(account)
        account['_id'] = str(account['_id'])
        return jsonify({'Account': account}), 200
    
    return jsonify({'message': 'No acount data found'}), 404

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

if __name__ == '__main__':
    app.run(debug=True)