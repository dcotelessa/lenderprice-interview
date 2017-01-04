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
.factory('listInfo', function(){
    var listdata = {
      lists: {
        assignee : {
          data: [],
          indx: {},
          loading: true
        },
        jobs : {
          data: [],
          indx: {},
          loading: true
        }
      },
      selected: 'assignee',
      filter: 'all',
      jobsExpanded: false
    };
  return listdata;
})
.controller('buttonsController', function($scope, $rootScope, $filter, amAPI, listInfo) {
  function indxArr(arr){
    var _obj = {};
    arr.reduce(function(prev,curr,idx,arr){
      if (!_obj[curr._id]){
        _obj[curr._id] = idx;
      }
    });
    return _obj;
  }

  function expandJobData(){
    /*this cleans up some of the data, as some of the data coming in is bad,
    it also adds an index to the jobs*/
    if (listInfo.lists.jobs){
      for (var all in listInfo.lists.assignee.data){
        var data = listInfo.lists.assignee.data[all];
        var jobs = data.jobs;
        var _obj = {};
        for (var job in jobs){
          //no dupes
          if (_obj[jobs[job]]){
            jobs.splice(job, 1);
          } else {
            _obj[jobs[job]] = job;
            var _joblist = listInfo.lists.jobs;
            var indx = _joblist.indx[jobs[job]];
            if (indx){
              jobs[job] = Object.assign({}, {_id: jobs[job], summary: _joblist.data[indx].summary});
            } else { //this doesn't exists in jobs
              jobs.splice(job, 1);
            }
          }
        }
        //reset __v
        data.__v = data.jobs.length;
      }
      listInfo.lists.jobsExpanded = true;
    }
  }

  $scope.loadingClasses = function(list){
    return (listInfo.lists[list].loading ? "is-loading" : "")  + (list === listInfo.selected? "" : " is-link");
  };

  $scope.tabClasses = function(tab){
    return (listInfo.filter === tab ? "is-active" : "");
  };

  $scope.setList = function(list){
    if (listInfo.selected !== list){
      listInfo.selected = list;
      $rootScope.$broadcast('displayChange', listInfo);
    }
  };

  $scope.summaryJobs = function(id){
    var jobInfo = $filter('filter')(listInfo.lists.jobs.data, {id: id})[0];
    return jobInfo.summary;
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
    listInfo.lists.assignee.loading = false;
    if (listInfo.selected === 'assignee'){
      $rootScope.$broadcast('displayChange', listInfo);
    }
  });

  amAPI.getJobs().then(function(data) {
    listInfo.lists.jobs.indx = indxArr(data);
    listInfo.lists.jobs.data = data;
    listInfo.lists.jobs.loading = false;
    expandJobData();
    if (listInfo.selected === 'jobs'){
      $rootScope.$broadcast('displayChange', listInfo);
    }
  });

})
.controller('displayController', function($scope, $filter){
  $scope.jobsExpanded = false;
  $scope.displayData = [];
  $scope.isEmpty = function(){
    return ($scope.displayData.length ? "" : "is-hidden");
  };

  $scope.setClassbyJobQuantity = function(num){
    var _num = num > 4 ? "job-4" : "job-" + num;
    return _num;
  };

  //broadcasts
  $scope.$on('displayChange', function(event, data){
    $scope.selectedFilter = $filter(data.filter);
    $scope.displayData = data.lists[data.selected].data;
    $scope.jobsExpanded = data.jobsExpanded;
    console.log($scope.$$watchers);
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
