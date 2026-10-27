"""Exercise the installed native app against an explicitly isolated test backend."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.parse import urlparse
from urllib.request import urlopen
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument("--serial", default="emulator-5556")
parser.add_argument("--test-base", default="http://127.0.0.1:3101")
parser.add_argument("--resume-report", action="store_true", help="Resume the exact synthetic report form after a driver interruption.")
args = parser.parse_args()
target = urlparse(args.test_base)
if target.hostname not in ("localhost", "127.0.0.1") or not re.fullmatch(r"emulator-\d+", args.serial):
    raise SystemExit("Native smoke writes are restricted to an emulator and loopback test backend.")
health = json.load(urlopen(args.test_base + "/api/health", timeout=10))
if not re.fullmatch(r"civicbridge_(?:test|ci|upgrade_test)(?:_[a-z0-9]+)?", health.get("testDatabase", "")):
    raise SystemExit("The server is not a disposable test database. Refusing native writes.")
urlopen(args.test_base + "/api/health/ready", timeout=10).close()
root = Path(__file__).resolve().parent.parent
adb = Path(os.environ["LOCALAPPDATA"]) / "Android/Sdk/platform-tools/adb.exe"
package = "in.civicbridge.community.preview"
def command(*parts):
    return subprocess.run([str(adb), "-s", args.serial, *parts], capture_output=True, text=True, encoding="utf-8", errors="replace", check=True).stdout
def hierarchy():
    command("shell", "uiautomator", "dump", "/sdcard/civicbridge-smoke.xml")
    text = command("shell", "cat", "/sdcard/civicbridge-smoke.xml")
    return ET.fromstring(text[text.index("<?xml"):])
def find(label):
    nodes = [node for node in hierarchy().iter("node") if node.get("package") == package]
    # Labels and native fields both expose the same text. Prefer the accessible
    # control instead of tapping the separate visible label above a text field.
    nodes.sort(key=lambda node: not bool(node.get("content-desc")))
    for node in nodes:
        if label in (node.get("content-desc"), node.get("text")) or node.get("content-desc", "").startswith(label + ","):
            bounds = [int(x) for x in re.findall(r"\d+", node.get("bounds", ""))]
            if len(bounds) == 4 and bounds[2] > bounds[0] and bounds[3] > bounds[1]:
                return bounds
    return None
def tap(label, scroll=True):
    for attempt in range(8):
        bounds = find(label)
        if bounds and label != "Account" and (bounds[1] < 220 or bounds[3] > 2274):
            # Accessibility may expose a partially clipped control beneath the
            # system navigation bar. Scroll it fully into view before tapping.
            bounds = None
        if bounds:
            command("shell", "input", "tap", str((bounds[0]+bounds[2])//2), str((bounds[1]+bounds[3])//2))
            time.sleep(0.4)
            print(f"Opened native control: {label} at {bounds}", flush=True)
            return
        if scroll:
            # Scroll in the content margin above the software keyboard, rather
            # than dragging through the keyboard or a multiline text field.
            command("shell", "input", "swipe", "40", "1100", "40", "350", "400")
        time.sleep(0.5)
    raise RuntimeError(f"Native control not found: {label}")
def fill(label, value):
    tap(label)
    # Pace injected keyboard events so controlled native fields can commit each
    # chunk, particularly when a multiline field wraps while the IME is open.
    for index in range(0, len(value), 12):
        command("shell", "input", "text", value[index:index + 12].replace(" ", "%s"))
        time.sleep(0.25)
    time.sleep(0.4)
    fields = [node for node in hierarchy().iter("node") if node.get("class") == "android.widget.EditText" and node.get("content-desc") == label]
    if not fields or (label != "Password" and fields[0].get("text") != value):
        raise RuntimeError(f"Native field did not retain its entered value: {label}")
    ime = command("shell", "dumpsys", "input_method")
    visible = re.search(r"mImeWindowVis=(0x[0-9a-fA-F]+|\d+)", ime)
    if visible and int(visible.group(1), 0) & 2 and re.search(r"\bmInputShown=true\b", ime):
        command("shell", "input", "keyevent", "4")
        time.sleep(0.4)

command("reverse", "tcp:3000", f"tcp:{target.port}")
if args.resume_report:
    title = next((node.get("text", "") for node in hierarchy().iter("node") if node.get("class") == "android.widget.EditText" and node.get("content-desc") == "Problem title"), "")
    if not re.fullmatch(r"android-native-\d+ unsafe footpath near the school", title):
        raise SystemExit("Resume requires the exact synthetic report form.")
else:
    command("shell", "pm", "clear", package)
    command("shell", "am", "start", "-n", package + "/.MainActivity")
    time.sleep(3)
    tap("Post a problem")
    fill("Email address", "citizen@demo.civicbridge.in")
    fill("Password", os.environ.get("DEMO_PASSWORD", "CivicBridge@2026"))
    tap("Sign in")
    for _ in range(12):
        if find("My activity"):
            break
        time.sleep(0.5)
    else:
        raise RuntimeError("Native sign-in did not open activity.")
    command("shell", "input", "keyevent", "4")
    tap("Post a problem")
    title = "android-native-" + str(int(time.time())) + " unsafe footpath near the school"
    fill("Problem title", title)
    fill("What’s happening?", "Broken pavement beside the school makes daily travel unsafe for children and older residents.")

tap("Continue")
command("shell", "input", "swipe", "40", "500", "40", "1800", "400")
fill("State / union territory", "Maharashtra")
fill("City / village", "Pune")
fill("Area / locality", "School lane")
fill("Latitude", "18.52")
fill("Longitude", "73.85")
tap("Continue")
tap("Submit report")
time.sleep(2)
if not find("Reported"):
    raise RuntimeError("Native submission did not reach its reported status screen.")
result = {"title": title, "database": health["testDatabase"], "nativeStatus": "REPORTED"}
(root / ".data/android-smoke.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
command("shell", "input", "keyevent", "4")
tap("Account")
tap("Sign out")
print("Native Android sign-in and report submission completed on the disposable backend.")
print("Verify and remove the exact test record using scripts/check-native-smoke.ts before reconnecting Atlas.")
