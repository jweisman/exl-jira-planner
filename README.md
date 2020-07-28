# Jira Planner

This project provides an interface for mid-long term planning of Jira stories. It includes the following modules:
* _Capacity_: enter and store capacity per team
* _Planning_: view showing the stories estimate against capacity per sprint with the ability to move stories (drag-and-drop or right-click) and save the changes back to Jira.

It was created to support product management planning at Ex Libris and makes many assumptions about workflow and Jira configuration based on the Ex Libris process.

## Development
This project consists of 3 components:
* Angular project (root)- `ng serve`
* Capacity service (service)- deployed as an AWS Serverless API + Lambda
* Jira Proxy (proxy) which handles OAuth- `npm start`

## Deployment
This project can be deployed to Docker as follows:
```
$ git clone https://github.com/jweisman/exl-jira-planner
$ cd exl-jira-planner
$ docker-compose build
$ docker-compose up
``` 