$components = @("UserManagement.jsx", "EmployeeCampaignManagement.jsx", "ContractorCampaignManagement.jsx")

foreach ($component in $components) {
  if (Test-Path $component) {
    $content = Get-Content $component -Raw
    
    # Button replacements
    $content = $content -replace 'className="btn-success btn-xs"', 'className="bg-green-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-green-500"'
    $content = $content -replace 'className="btn-secondary btn-xs"', 'className="bg-gray-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:ring-gray-500"'
    $content = $content -replace 'className="btn-primary btn-xs"', 'className="bg-blue-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:ring-blue-500"'
    $content = $content -replace 'className="btn-info btn-xs"', 'className="bg-cyan-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-700 focus:ring-cyan-500"'
    
    $content = $content -replace 'className="btn-success btn-sm"', 'className="bg-green-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-green-500"'
    $content = $content -replace 'className="btn-secondary btn-sm"', 'className="bg-gray-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:ring-gray-500"'
    $content = $content -replace 'className="btn-primary btn-sm"', 'className="bg-blue-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:ring-blue-500"'
    
    # Container and layout replacements
    $content = $content -replace 'className="page-container"', 'className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8"'
    $content = $content -replace 'className="section-container"', 'className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200"'
    $content = $content -replace 'className="page-title"', 'className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-6"'
    $content = $content -replace 'className="section-title"', 'className="text-lg font-semibold text-gray-900 mb-4"'
    $content = $content -replace 'className="action-buttons"', 'className="flex flex-wrap gap-2"'
    $content = $content -replace 'className="table-container"', 'className="overflow-x-auto bg-white rounded-lg border border-gray-200"'
    $content = $content -replace 'className="loading-container"', 'className="flex items-center justify-center py-8"'
    $content = $content -replace 'className="loading-spinner"', 'className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"'
    $content = $content -replace 'className="loading-text"', 'className="ml-2 text-gray-600"'
    
    # Form replacements
    $content = $content -replace 'className="form-input"', 'className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"'
    $content = $content -replace 'className="form-textarea"', 'className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 resize-vertical"'
    $content = $content -replace 'className="form-select"', 'className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 cursor-pointer"'
    $content = $content -replace 'className="form-label"', 'className="block text-sm font-medium text-gray-700 mb-2"'
    $content = $content -replace 'className="form-group"', 'className="mb-4"'
    
    # Alert replacements  
    $content = $content -replace 'className="alert-error"', 'className="px-4 py-3 rounded-lg mb-4 border bg-red-50 border-red-200 text-red-700"'
    $content = $content -replace 'className="alert-success"', 'className="px-4 py-3 rounded-lg mb-4 border bg-green-50 border-green-200 text-green-700"'
    
    Set-Content -Path $component -Value $content
    Write-Output "Updated $component"
  }
}
