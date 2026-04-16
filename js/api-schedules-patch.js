// api-schedules-patch.js
// 광고그룹 노출 시간대(schedules) PUT API

function updateAdGroupSchedules(adGroupId, schedules) {
  return apiRequest('/ncc/adgroups/' + adGroupId, 'GET').then(function(current) {
    var payload = Object.assign({}, current, {
      id: adGroupId,
      schedules: schedules
    });
    var READ_ONLY = ['regTm', 'editTm', 'status', 'statusReason', 'recentCampaignStatus', 'nccCampaignId'];
    READ_ONLY.forEach(function(k) { delete payload[k]; });
    return apiRequest('/ncc/adgroups/' + adGroupId, 'PUT', payload);
  });
}

window.updateAdGroupSchedules = updateAdGroupSchedules;
