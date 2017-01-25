var statusArr = ["New", "In Progress", "Completed"];

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
        return this.lists.jobs.data[this.lists.jobs.indx[input]].status === "In Progress";
      };
  })
  .filter('completed', function() {
    return function(input) {
        return this.lists.jobs.data[this.lists.jobs.indx[input]].status === "Completed";
      };
  })
.factory('listInfo', function(){
    var listdata = {
      lists: {
        assignee : {
          data: [],
          indx: {},
          loaded: false,
          cleaned: false,
          expanded: null,
          filter: 'all'
        },
        jobs : {
          data: [],
          indx: {},
          cleaned: false,
          loaded: false
        }
      },
      filter: 'all'
    };
  return listdata;
})
.controller('buttonsController', function($scope, $rootScope, $filter, amAPI, listInfo) {
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
          status = "New";

          if (job.start_date){
            if (job.end_date) {
              status = "Completed";
            } else {
              status = "In Progress";
            }
          }

          if (job.status) {
              checkstatus = job.status.split(",").pop();
              if (statusArr.indexOf(checkstatus) > -1){
                status = checkstatus;
              }
          }
          listInfo.lists.jobs.data[all].status = status; //set new status
          _obj[job._id] = true;
        }
      }
      listInfo.lists.jobs.cleaned = true;
    }
  }

  $scope.isLoading = function(){
    var dataLoaded = (listInfo.lists.assignee.loaded && listInfo.lists.jobs.loaded);
    return !dataLoaded;
  };

  $scope.tabClasses = function(tab){
    return (listInfo.filter === tab ? "is-active" : "");
  };

  $scope.setFilter = function(filtr){
    if (listInfo.filter !== filtr){
      listInfo.filter = filtr;
      $rootScope.$broadcast('displayChange', listInfo);
    }
  };

  amAPI.getAssignees().then(function(data) {
    listInfo.lists.assignee.indx = indxArr(data);
    listInfo.lists.assignee.data = data;
    listInfo.lists.assignee.loaded = true;
    if (!listInfo.lists.jobs.cleaned){
      cleanJobs();
    }
    cleanData();
    $rootScope.$broadcast('displayChange', listInfo);
  });

  amAPI.getJobs().then(function(data) {
    listInfo.lists.jobs.indx = indxArr(data);
    listInfo.lists.jobs.data = data;
    listInfo.lists.jobs.loaded = true;
    cleanJobs();

    if (!listInfo.lists.assignee.cleaned){
      cleanData();
    }
    $rootScope.$broadcast('displayChange', listInfo);
  });

})
.controller('displayController', function($scope, $rootScope, $filter, listInfo){
  $scope.displayData = [];
  $scope.isEmpty = function(){
    return ($scope.displayData.length ? "" : "is-hidden");
  };

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
      $rootScope.$broadcast('displayChange', listInfo);
    }
  };

  $scope.uniqueName = function(q){
    if (!q) {
      return true;
    }
    // var some = listInfo.lists.assignee.data.some(function(e){
    //   return (e.name === q);
    // });
    // return some;

    return false;
  };

  $scope.jobData = function(item, data){
    return listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]][data];
  };

  $scope.jobStatusSort = function (item){
    var status = listInfo.lists.jobs.data[listInfo.lists.jobs.indx[item]].status;
    return statusArr.indexOf(status);
  };

  $scope.collapseItem = function(item){
    listInfo.lists.assignee.expanded = null;
    $rootScope.$broadcast('displayChange', listInfo);
  };

  $scope.expandItem = function(item){
    listInfo.lists.assignee.expanded = item;
    $rootScope.$broadcast('displayChange', listInfo);
  };

  $scope.addAssignee = function(item){
    console.log('addAssignee');
  };

  $scope.requestUpdateAssignee = function(item){
    $scope.editingAssignee = true;
  };

  $scope.cancelUpdateAssignee = function(item){
    $scope.editingAssignee = false;
  };

  $scope.updateAssignee = function(item){
    console.log('updateAssignee');
  };

  $scope.deleteAssignee = function(item){
    console.log('deleteAssignee');
  };

  $scope.addJob = function(){
    console.log('addJob');
  };

  $scope.requestAddJob = function(){
    $scope.addingJob = true;
  };

  $scope.cancelAddJob = function(){
    $scope.addingJob = false;
  };
  
  $scope.updateJob = function(){
    console.log('updateJob');
  };

  $scope.requestUpdateJob = function(item){
    $scope.editingJob = true;
  };

  $scope.cancelUpdateJob = function(item){
    $scope.editingJob = false;
  };

  $scope.deleteJob = function(item){
    console.log('deleteJob');
  };

  $scope.startJob = function(item){
    console.log('startJob');
  };

  $scope.unassignJob = function(item){
    console.log('unassignJob');
  };

  $scope.completeJob = function(item){
    console.log('completeJob');
  };

  //broadcasts
  $scope.$on('displayChange', function(event, data) {
    $scope.addingAssignee = false;
    $scope.editingAssignee = false;
    $scope.addingJob = false;
    $scope.editingJob = false;
    $scope.selectedFilter = $filter(data.filter);
    $scope.selectedJobFilter = $filter(data.lists.assignee.filter).bind(data);
    $scope.displayData = data.lists.assignee.data;
    $scope.jobsData = data.lists.jobs.data;
    $scope.assigneeExpanded = data.lists.assignee.expanded;
    // console.log($scope.$$watchers.length);
  });
});

angular.module('assignmentManagerApp.services', [])
  .factory('amAPI', function($q, $http) {
    var hostURL = "http://interview.lenderprice.com:7070/";

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
      getJobs: getList('jobs')
    };
    return service;
   });
