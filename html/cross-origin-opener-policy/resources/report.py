import json

def main(request, response):
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    # CORS preflight
    if request.method == 'OPTIONS':
        return ''

    uuidMap = {
        'coop-report-endpoint': '01234567-0123-0123-0123-000000000001',
        'coop-report-only-endpoint': '01234567-0123-0123-0123-000000000002',
        'coop-popup-report-endpoint': '01234567-0123-0123-0123-000000000003',
        'coop-popup-report-only-endpoint': '01234567-0123-0123-0123-000000000004',
        'coop-redirect-report-endpoint': '01234567-0123-0123-0123-000000000005',
        'coop-redirect-report-only-endpoint': '01234567-0123-0123-0123-000000000006'
    }
    key = 0;
    if 'endpoint' in request.GET:
        key = uuidMap[request.GET['endpoint']]

    if key == 0:
        response.status = 400
        return 'invalid endpoint'

    path = '/'.join(request.url_parts.path.split('/')[:-1]) + '/'
    if request.method == 'POST':
        reports = request.server.stash.take(key, path) or []
        for report in json.loads(request.body):
            reports.append(report)
        request.server.stash.put(key, reports, path)
        return "done"+key+request.body

    if request.method == 'GET':
        response.headers.set('Content-Type', 'application/json')
        return json.dumps(request.server.stash.take(key, path) or [])

    response.status = 400
    return 'invalid method'
