var statusArr = ["New", "In_Progress", "Completed"];

angular.module('assignmentManagerApp', [
  'assignmentManagerApp.services'
])
  .filter('all', function() {
    return function(input) {
        return input;
      };
  })
  .filter('unassigned', function() {
    return function(input) {
        return input.__v === 0;
      };
  })
  .filter('assigned', function() {
    return function(input) {
        return input.__v > 0;
      };
  })
  .filter('in_progress', function() {
    return function(input) {
        return this.data[this.indx[input]].status === "In_Progress";
      };
  })
  .filter('completed', function() {
    return function(input) {
        return this.data[this.indx[input]].status === "Completed";
      };
  })
.factory('listInfo', function(){
    var listdata = {
      lists: {
        assignee : {
          data: [],
          indx: {},
          cleaned: false,
          filter: 'all'
        },
        jobs : {
          data: [],
          indx: {},
          cleaned: false
        }
      },
      filter: 'all',
      assigneesLoadedStatus: 'assigneesNotLoaded',
      jobsStatus: 'notLoaded'
    };
  return listdata;
})
.controller('buttonsController', function($scope, $rootScope, $filter, amAPI, listInfo) {
  $scope.assigneesLoadedStatus = listInfo.assigneesLoadedStatus;

  function indxArr(arr){
    var _obj = {};
    var curr;
    for (var idx in arr) {
      curr = arr[idx];
      if (!_obj[curr._id]){
        _obj[curr._id] = idx;
      }
    }
    return _obj;
  }

  function cleanData(){
    /*this cleans up some of the data, as some of the data coming in is bad,
    it also adds an index to the jobs*/
    if (listInfo.lists.jobs.data.length > 0){
      //clean job info
      var _obj = {},
        job, all, data;

      //clean job array in assignee
      for (all in listInfo.lists.assignee.data){
        data = listInfo.lists.assignee.data[all];
        _obj = {};
        for (job in data.jobs){
          //no dupes
          if (data.jobs[job] === null || _obj[data.jobs[job]]){
            data.jobs.splice(job, 1);
          }

          _obj[data.jobs[job]] = true;

          if (listInfo.lists.jobs.indx[data.jobs[job]]){
            listInfo.lists.jobs.data[listInfo.lists.jobs.indx[data.jobs[job]]].assigned = true;
          }
        }
        data.template = 'displayAssignee';
        //reset __v
        data.__v = data.jobs.length;

      }
      listInfo.lists.assignee.cleaned = true;
    }
  }

  function cleanJobs(){
    /*this cleans up some of the data, as some of the data coming in is bad,
    it also adds an index to the jobs*/

    if (listInfo.lists.jobs.data.length > 0){
      //clean job info
      var _obj = {},
        status, checkstatus, job, all, data;
      for (all in listInfo.lists.jobs.data){
        job = listInfo.lists.jobs.data[all];
        //no dupes
        if (_obj[job._id]){
          listInfo.lists.jobs.data.splice(job, 1);
          listInfo.lists.jobs.indx[job._id] = undefined;
        } else {
          status = ["New"];

          if (job.start_date){
            if (job.end_date) {
              status = ["Completed"];
            } else {
              status = ["In_Progress"];
            }
          }

          if (job.status) {
              checkstatus = job.status.split(",").pop();
              if (statusArr.indexOf(checkstatus) > -1){
                status = [checkstatus];
              }
          }
          listInfo.lists.jobs.data[all].status = status; //set new status
          _obj[job._id] = true;
        }
      }
      listInfo.lists.jobs.cleaned = true;
    }
  }

  $scope.tabClasses = function(tab){
    return (listInfo.filter === tab ? "is-active" : "");
  };

  $scope.setFilter = function(filtr){
    if (listInfo.filter !== filtr){
      listInfo.filter = filtr;
      $rootScope.$broadcast('assigneeChange', listInfo);
    }
  };

  amAPI.getAssignees().then(function(data) {
    listInfo.lists.assignee.indx = indxArr(data);
    listInfo.lists.assignee.data = data;
    if (!listInfo.lists.jobs.cleaned){
      cleanJobs();
    }
    cleanData();
    listInfo.assigneesLoadedStatus = 'assigneesLoaded';
    $rootScope.$broadcast('assigneeChange', listInfo);

  });

  amAPI.getJobs().then(function(data) {
    listInfo.lists.jobs.indx = indxArr(data);
    listInfo.lists.jobs.data = data;
    cleanJobs();

    if (!listInfo.lists.assignee.cleaned){
      cleanData();
    }
    listInfo.jobsStatus = 'displayJobs';
    $rootScope.$broadcast('jobChange', listInfo);
  });

  $scope.$on('assigneeChange', function(event, data) {
    $scope.assigneesLoadedStatus = data.assigneesLoadedStatus;
  });

})
.controller('displayController', function($scope, $rootScope, $filter, amAPI, listInfo){
  $scope.displayData = [];

  $scope.setClassbyJobQuantity = function(num){
    var _num = num > 4 ? "job-4" : "job-" + num;
    return _num;
  };

  $scope.tabJobClasses = function(tab){
    return (listInfo.lists.assignee.filter === tab ? "is-active" : "");
  };

  $scope.setJobFilter = function(filtr){
    if (listInfo.lists.assignee.filter !== filtr){
      listInfo.lists.assignee.filter = filtr;
      $rootScope.$broadcast('jobChange', listInfo);
    }
  };

  $scope.typingName = function(q){
    if (!q) {
      return true;
    }

    return false;
  };

  $scope.jobData = function(item, data){
    return listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]][data];
  };

  $scope.jobStatusSort = function (item){
    var status = listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].status;
    return statusArr.indexOf(status);
  };

  $scope.setAssigneeStatus = function(state, item){
    for (var i = 0; i < listInfo.lists.assignee.data.length; i++){
      listInfo.lists.assignee.data[i].template = "displayAssignee";
    }
    listInfo.jobsStatus = 'displayJobs';

    listInfo.lists.assignee.data[listInfo.lists.assignee.indx[item]].template = state;
    $rootScope.$broadcast('assigneeChange', listInfo);
  };

  $scope.setJobsStatus = function(state, item){
    $scope.editingJob = listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]];
    $scope.previousStatus = $scope.jobsStatus;
    listInfo.jobsStatus = state;
    $scope.displayData = [];
    $rootScope.$broadcast('assigneeChange', listInfo);
  };

  $scope.addAssignee = function(n){
    var input = {
      name: n
    };
    $scope.setAssigneeStatus("notLoaded");
    amAPI.addAssignee(input).then(function(data) {
      $scope.setAssigneeStatus("displayAssignee");
    });
  };

  $scope.updateAssignee = function(item, n){
    console.log('updateAssignee - not now');
  };

  $scope.deleteAssignee = function(item){
    console.log('deleteAssignee - not now');
  };

  $scope.addJob = function(n, d){
      var input = {
  			name: n,
  			description: d
  		};
      $scope.setJobsStatus("notLoaded");
      amAPI.addJob(input).then(function(data) {
        $scope.setJobsStatus(previousStatus);
      });
  };

  $scope.updateJob = function(item, su, d, sts, sd, ed){
    var input = {
			summary: su,
			description: d,
      status: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].status,
      startdate: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].startdate,
      enddate: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].enddate
		};
    listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]] = input;
    $scope.setJobsStatus("notLoaded");
    amAPI.updateJob(item, input).then(function(data) {
      $scope.setJobsStatus(previousStatus);
    });
  };

  $scope.deleteJob = function(item){
    console.log('deleteJob - not now');
  };

  $scope.startJob = function(item){
    var input = {
			summary: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].summary,
			description: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].description,
      status: ["In_Progress"],
      startdate: Date.now(),
      enddate: ""
		};
    listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]] = input;
    $scope.setJobsStatus("notLoaded");
    amAPI.updateJob(item, input).then(function(data) {
      $rootScope.$broadcast('jobChange', listInfo);
      $rootScope.$broadcast('assignChange', listInfo);
    });
  };

  $scope.assignJob = function(a, job){
    var input = {
			assignee_id: a,
			job_id: job
		};
    $scope.setJobsStatus("notLoaded");
    amAPI.assignJob(item, input).then(function(data) {
      $scope.setJobsStatus(previousStatus);
    });
  };

  $scope.unassignJob = function(item){
    console.log('unassignJob - not now');
    setJobsStatus(previousStatus);
  };

  $scope.completeJob = function(item){
    var input = {
			summary: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].summary,
			description: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].description,
      status: ["Completed"],
      startdate: listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].startdate,
      enddate: Date.now()
		};
    listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]] = input;
    $scope.setJobsStatus("notLoaded");
    amAPI.updateJob(item, input).then(function(data) {
      $rootScope.$broadcast('jobChange', listInfo);
      $rootScope.$broadcast('assignChange', listInfo);
    });
  };

  function clearSelections(){
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  }

  //broadcasts
  $scope.$on('assigneeChange', function(event, data) {
    $scope.selectedAssigneeFilter = $filter(data.filter);
    $scope.jobsStatus = listInfo.jobsStatus;
    $scope.displayData = data.lists.assignee.data;
    clearSelections();
  });

  $scope.$on('jobChange', function(event, data) {
    $scope.jobsData = data.lists.jobs.data;
    $scope.selectedJobFilter = $filter(data.lists.assignee.filter).bind(data.lists.jobs);
    // console.log($scope.$$watchers.length);
    clearSelections();
  });
});

angular.module('assignmentManagerApp.services', [])
  .factory('amAPI', function($q, $http) {
    var hostURL = "http://interview.lenderprice.com:7070/";

    var addList = function(s){
      var path = s;
      return function(input){
         var d = $q.defer();
         $http.post(hostURL + 'api/' + path, input)
         .then(function(data, status) {
           d.resolve(data.data);
         }, function(data, status) {
          d.reject(data);
        });
        return d.promise;
      };
    };

    var updateList = function(s){
      var path = s;
      return function(id, input){
         var d = $q.defer();
         $http.post(hostURL + 'api/' + path + "/" + id, input)
         .then(function(data, status) {
           d.resolve(data.data);
         }, function(data, status) {
          d.reject(data);
        });
        return d.promise;
      };
    };

    var assignJob = function(){
      return function(input){
         var d = $q.defer();
         $http.post(hostURL + 'api/assignjob', input)
         .then(function(data, status) {
           d.resolve(data.data);
         }, function(data, status) {
          d.reject(data);
        });
        return d.promise;
      };
    };

    var getList = function(s){
      var path = s;
      return function(){
         var d = $q.defer();
         $http.get(hostURL + 'api/' + path)
         .then(function(data, status) {
           d.resolve(data.data);
         }, function(data, status) {
          d.reject(data);
        });
        return d.promise;
      };
    };

    var service = {
      getAssignees: getList('assignee'),
      getJobs: getList('jobs'),
      updateAssignee: updateList('assignee'),
      updateJob: updateList('jobs'),
      addAssignee: addList('assignee'),
      addJob: addList('jobs'),
      assignJob: assignJob()
    };
    return service;
   });
