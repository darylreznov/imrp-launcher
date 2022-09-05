DetectHiddenWindows, On
WinGet, List, List, ahk_class AutoHotkey
scripts := ""
Loop % List {
   WinGetTitle, title, % "ahk_id" List%A_Index%
   scripts .=  (scripts ? "`r`n" : "") . RegExReplace(title, " - AutoHotkey v[\.0-9]+$")
}
file := FileOpen(A_Temp "\list.dat", "w") 
file.write(scripts)
file.close()