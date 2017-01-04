############ FRONT END ASSIGNMENT ########################

Please build a website that uses the following apis to create tasks and assign them to people

HOST:
	http://interview.lenderprice.com:7070/

APIS:
	api/jobs (GET) - returns a list of jobs
	api/jobs (POST) - creates a new empty job 
		postdata:{
			name: string,
			description: string
		}
	api/jobs/<job_id> (GET)- returns 1 task or job
	api/jobs/<job_id> (POST) - update a particular job 
		postdata:{
			job:{
				summary: string
			description:String,
			status: []
			start_date:Date
			end_date:Date
			}
		}
	api/assignjob?
		query-params:
				assignee_id = <assignee_id> 
				job_id = <job_id>

	api/assignee (GET) - returns a list of assignee
	api/assignee (POST) - creates a new assignee
	api/assignee/<assignee_id> (GET) - get assignee 
	api/assignee/<assignee_id> (POST) - update assignee - avoid this api for now

if some of the apis do not work don't worry we are judging based on the following criteria

how well you organize your code
how well you can design (be creative)
scenarios accounted for(for example what if there are many pieces of data)
