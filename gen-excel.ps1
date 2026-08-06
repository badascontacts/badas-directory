Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Add()

function RGB2Dec($r,$g,$b) { return $r + ($g * 256) + ($b * 65536) }

$hdrBg   = RGB2Dec 13 71 161     # Deep Dark Blue #0D47A1
$hdrFg   = RGB2Dec 255 255 255   # White
$dataBg  = RGB2Dec 235 245 255   # Very light blue
$altBg   = RGB2Dec 248 252 255   # Alternate row

function StyleHeader($ws, $colCount) {
  $ws.Rows(1).Font.Bold = $true
  $ws.Rows(1).Font.Color = $hdrFg
  $ws.Rows(1).Interior.Color = $hdrBg
  $ws.Rows(1).RowHeight = 26
  $ws.Rows(1).HorizontalAlignment = -4108
  $ws.Rows(1).VerticalAlignment = -4108
  # Freeze header row
  $ws.Range("A2").Select() | Out-Null
  $ws.Application.ActiveWindow.FreezePanes = $true
}

function AddRow($ws, $row, $data) {
  for ($c=0;$c -lt $data.Count;$c++) { $ws.Cells($row,$c+1).Value2 = $data[$c] }
  $bg = if ($row % 2 -eq 0) { $dataBg } else { $altBg }
  $ws.Cells($row,1).EntireRow.Interior.Color = $bg
}

function FinalSheet($ws, $widths) {
  $ws.UsedRange.Borders.LineStyle = 1
  $ws.UsedRange.Borders.Weight = 2
  $ws.UsedRange.Borders.Color = RGB2Dec 200 215 235
  for ($i=0;$i-lt $widths.Count;$i++) { $ws.Columns($i+1).ColumnWidth=$widths[$i] }
  $ws.Columns(1).EntireColumn.Font.Name = "Arial"
}

# ════ SHEET 1: Organizations ════
$ws1 = $wb.Sheets(1); $ws1.Name = "Organizations"
$ws1.Activate()
$h = @("org_id","org_name","org_full_name","logo_url","address","phone","email","website","about","color")
for ($i=0;$i-lt $h.Count;$i++) { $ws1.Cells(1,$i+1).Value2 = $h[$i] }
StyleHeader $ws1 $h.Count

$orgs = @(
  @("BADAS","BADAS","Diabetic Association of Bangladesh","","122 Kazi Nazrul Islam Ave, Dhaka-1000","+880-2-9669551","info@badas.org.bd","https://www.badas.bd","BADAS is the pioneering diabetic welfare org in Bangladesh since 1956.","#0D47A1"),
  @("BIRDEM","BIRDEM","Bangladesh Institute of Research & Rehabilitation in Diabetes, Endocrine and Metabolic Disorders","","Shahbagh, Dhaka-1000","+880-2-9669974","info@birdem-gh.com","https://www.birdembd.org","Specialized referral hospital under BADAS.","#00796B"),
  @("IMC","IMC","Ibrahim Medical College","","Shahbagh, Dhaka-1000","+880-2-9663951","info@imc.edu.bd","https://imc.edu.bd","Medical college affiliated with BADAS.","#6A1B9A"),
  @("BIHS","BIHS","Bangladesh Institute of Health Sciences","","Mirpur-1, Dhaka-1216","+880-2-8016401","info@bihs.edu.bd","https://bihs.edu.bd","Health sciences university under BADAS.","#C62828"),
  @("NCDC","NCDC","National Centre for Control of Rheumatic Fever and Heart Disease","","Tejgaon, Dhaka-1208","+880-2-8119000","info@ncdc-badas.org","","Cardiac and diabetes care under BADAS.","#E65100")
)
for ($r=0;$r-lt $orgs.Count;$r++) { AddRow $ws1 ($r+2) $orgs[$r] }
# Color cells for the color column
for ($r=0;$r-lt $orgs.Count;$r++) {
  $hex=$orgs[$r][9]; $rv=[Convert]::ToInt32($hex.Substring(1,2),16); $gv=[Convert]::ToInt32($hex.Substring(3,2),16); $bv=[Convert]::ToInt32($hex.Substring(5,2),16)
  $ws1.Cells($r+2,10).Interior.Color=RGB2Dec $rv $gv $bv
  $ws1.Cells($r+2,10).Font.Color=$hdrFg; $ws1.Cells($r+2,10).Font.Bold=$true
}
# 25 empty rows for user to add more orgs
for ($r=7;$r-le 30;$r++) { $ws1.Cells($r,1).EntireRow.Interior.Color = $altBg }
FinalSheet $ws1 @(12,14,50,35,38,18,28,32,45,14)

# ════ SHEET 2: Contacts ════
$ws2 = $wb.Sheets.Add([System.Reflection.Missing]::Value,$wb.Sheets($wb.Sheets.Count)); $ws2.Name = "Contacts"
$ws2.Activate()
$h = @("contact_id","org_id","name","designation","department","phone","email","photo_url","has_whatsapp","ext")
for ($i=0;$i-lt $h.Count;$i++) { $ws2.Cells(1,$i+1).Value2 = $h[$i] }
StyleHeader $ws2 $h.Count

$contacts = @(
  @("C001","BADAS","নাম লিখুন","President","Executive Committee","+8801711000001","president@badas.org.bd","","TRUE","101"),
  @("C002","BADAS","নাম লিখুন","Secretary General","Executive Committee","+8801711000002","sg@badas.org.bd","","TRUE","102"),
  @("C003","BADAS","নাম লিখুন","Director Finance","Finance","+8801711000003","finance@badas.org.bd","","FALSE",""),
  @("C004","BIRDEM","নাম লিখুন","Director General","Administration","+8801711000004","dg@birdem-gh.com","","TRUE","201"),
  @("C005","IMC","নাম লিখুন","Principal","Administration","+8801711000005","principal@imc.edu.bd","","TRUE","301")
)
for ($r=0;$r-lt $contacts.Count;$r++) { AddRow $ws2 ($r+2) $contacts[$r] }
# Pre-fill 95 more contact IDs for easy data entry
for ($r=7;$r-le 100;$r++) { 
  $id = "C" + ($r-1).ToString().PadLeft(3,'0')
  $ws2.Cells($r,1).Value2 = $id
  $bg = if ($r%2-eq 0) {$dataBg} else {$altBg}
  $ws2.Cells($r,1).EntireRow.Interior.Color = $bg
}
FinalSheet $ws2 @(12,12,28,28,22,18,28,35,14,8)

# ════ SHEET 3: Emergency ════
$ws3 = $wb.Sheets.Add([System.Reflection.Missing]::Value,$wb.Sheets($wb.Sheets.Count)); $ws3.Name = "Emergency"
$ws3.Activate()
$h = @("contact_id","name","designation","org_id","phone","type","is_active")
for ($i=0;$i-lt $h.Count;$i++) { $ws3.Cells(1,$i+1).Value2 = $h[$i] }
StyleHeader $ws3 $h.Count
$emg = @(
  @("E001","BIRDEM Emergency","Emergency Dept","BIRDEM","+880-2-9669974","Hospital","TRUE"),
  @("E002","BADAS HQ","Reception","BADAS","+880-2-9667551","Admin","TRUE"),
  @("E003","BIRDEM Ambulance","Ambulance","BIRDEM","+880-2-9669001","Ambulance","TRUE"),
  @("E004","National Police","Helpline","","999","Police","TRUE"),
  @("E005","Fire & Ambulance","National","","199","Ambulance","TRUE")
)
for ($r=0;$r-lt $emg.Count;$r++) { AddRow $ws3 ($r+2) $emg[$r] }
for ($r=7;$r-le 30;$r++) { $ws3.Cells($r,1).EntireRow.Interior.Color = $altBg }
FinalSheet $ws3 @(12,28,22,12,16,14,12)

# ════ SHEET 4: BannerAd ════
$ws4 = $wb.Sheets.Add([System.Reflection.Missing]::Value,$wb.Sheets($wb.Sheets.Count)); $ws4.Name = "BannerAd"
$ws4.Activate()
$h = @("image_url","click_url","is_active")
for ($i=0;$i-lt $h.Count;$i++) { $ws4.Cells(1,$i+1).Value2 = $h[$i] }
StyleHeader $ws4 3
$ws4.Cells(2,1).Value2="https://your-banner-image-url.jpg"; $ws4.Cells(2,2).Value2="https://badas.org.bd"; $ws4.Cells(2,3).Value2="FALSE"
$ws4.Cells(2,1).EntireRow.Interior.Color=$dataBg
FinalSheet $ws4 @(50,40,12)

# ════ SHEET 5: Settings ════
$ws5 = $wb.Sheets.Add([System.Reflection.Missing]::Value,$wb.Sheets($wb.Sheets.Count)); $ws5.Name = "Settings"
$ws5.Activate()
$h = @("key","value")
for ($i=0;$i-lt $h.Count;$i++) { $ws5.Cells(1,$i+1).Value2 = $h[$i] }
StyleHeader $ws5 2
$settings = @(
  @("password","BADAS@2024"),
  @("hint","Contact the BADAS IT department for the password."),
  @("app_version","2.0.0")
)
for ($r=0;$r-lt $settings.Count;$r++) {
  AddRow $ws5 ($r+2) $settings[$r]
  $ws5.Cells($r+2,1).Font.Bold=$true
}
$ws5.Cells(2,2).Font.Color=RGB2Dec 13 71 161
$ws5.Cells(2,2).Font.Bold=$true
FinalSheet $ws5 @(20,60)

$path="C:\Users\user\Desktop\BADAS-Directory-Template.xlsx"
$wb.SaveAs($path,51); $wb.Close($false); $excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "SUCCESS: $path"
