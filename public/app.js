(function(){
  angular.module('fileApp', [])
    .controller('MainCtrl', ['$http', '$timeout', function($http, $timeout){
      const vm = this;
      vm.tab = 'home';
      vm.docs = [];
      vm.loadingDocs = false;
      vm.selectedFile = null;
      vm.uploading = false;

      vm.setTab = function(t){ vm.tab = t; if (t==='home') vm.loadDocs(); };

      vm.humanSize = function(bytes){
        if (!bytes) return '0 B';
        const thresh = 1024;
        if (Math.abs(bytes) < thresh) return bytes + ' B';
        const units = ['KB','MB','GB','TB'];
        let u = -1;
        do { bytes /= thresh; ++u; } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1)+' '+units[u];
      };

      vm.loadDocs = function(){
        vm.loadingDocs = true;
        $http.get('/api/documents').then(function(res){ vm.docs = res.data; vm.loadingDocs = false; }, function(){ vm.loadingDocs = false; });
      };

      // drag/drop handling
      const dropArea = document.getElementById('dropArea');
      const fileInput = document.getElementById('fileInput');
      const uploadDetails = document.getElementById('uploadDetails');

      function prevent(e){ e.preventDefault(); e.stopPropagation(); }

      ['dragenter','dragover'].forEach(evt => dropArea.addEventListener(evt, function(e){ prevent(e); dropArea.classList.add('active'); }));
      ['dragleave','dragend'].forEach(evt => dropArea.addEventListener(evt, function(e){ prevent(e); dropArea.classList.remove('active'); }));
      dropArea.addEventListener('drop', function(e){ prevent(e); dropArea.classList.remove('active'); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) selectFile(f); });
      dropArea.addEventListener('click', function(){ fileInput.click(); });
      fileInput.addEventListener('change', function(e){ const f = e.target.files && e.target.files[0]; if (f) selectFile(f); });

      function selectFile(f){ vm.selectedFile = f; uploadDetails.innerHTML = '<strong>'+f.name+'</strong> — '+vm.humanSize(f.size); $timeout(()=>{}); }

      vm.clear = function(){ vm.selectedFile = null; fileInput.value = ''; uploadDetails.innerHTML = ''; };

      vm.upload = function(){
        if (!vm.selectedFile) return;
        vm.uploading = true;
        const fd = new FormData();
        fd.append('document', vm.selectedFile);
        $http.post('/api/upload', fd, { headers: {'Content-Type': undefined}, transformRequest: angular.identity })
          .then(function(res){
            vm.uploading = false; vm.selectedFile = null; fileInput.value = ''; uploadDetails.innerHTML = '<span class="text-success">Uploaded</span>';
            // refresh home list
            vm.setTab('home');
          }, function(err){
            vm.uploading = false; uploadDetails.innerHTML = '<span class="text-danger">Upload failed</span>';
            console.error(err);
          });
      };

      // initial load
      vm.loadDocs();

    vm.deleteDoc = function(doc){
      if (!doc || !doc.id) return;
      if (!confirm('Are you sure you want to delete "'+doc.filename+'"?')) return;
      vm.deletingDocId = doc.id;

      $http.delete('/api/documents/' + doc.id).then(function(){
        vm.deletingDocId = null;
        vm.loadDocs();
      }, function(err){
        vm.deletingDocId = null;
        alert('Failed to delete document.');
        console.error(err);
      });
    };

    }]);
})();
