document.addEventListener('DOMContentLoaded', function() {

})

$PI.onConnected(jsn => {
	const el = document.querySelectorAll(`[data-uuid="${$PI.actionInfo.action}"]`)
	const active = document.querySelectorAll('.active')

	active.forEach(e => e.classList.remove('active'))
	el.forEach(e => e.classList.add('active'))

	console.log('Property Inspector connected', jsn);
    console.log(jsn.actionInfo.payload.settings);
    Object.entries(jsn.actionInfo.payload.settings).forEach(([key, value]) => {
        console.log('setting', key, value);
        const el = document.getElementById(key);
        if(el) {
            el.value = value;
        }
    });

    let actionUUID = $PI.actionInfo.action;
    // register a callback for the 'sendToPropertyInspector' event
    $PI.onSendToPropertyInspector(actionUUID, jsn => {
        console.log('onSendToPropertyInspector', jsn);
        // sdpiCreateList(document.querySelector('#runningAppsContainer'), {
        //     id: 'runningAppsID',
        //     label: 'Running Apps',
        //     value: jsn.payload.runningApps,
        //     type: 'list',
        //     selectionType: 'no-select'
        // });
    });
});
