import os
import ftplib

FTP_HOST = "voxcuriosa.no"
FTP_USER = "cpjvfkip"
FTP_PASS = "F2gw2FSXJcJLtk!"
REMOTE_TARGET = "public_html/roma"

FILES_TO_UPLOAD = [
    "index.html", "script.js", "style.css", 
    "georef.php", "save_georef.php", "admin_check.php", "upload.php",
    "image_proxy.php", ".htaccess", ".user.ini"
]
DIRS_TO_UPLOAD = ["data", "assets"]

def upload_file(ftp, local_path, filename):
    try:
        local_size = os.path.getsize(local_path)
        try:
            remote_size = ftp.size(filename)
            if local_size == remote_size:
                # print(f"Skipping (identical size): {filename}")
                return
        except:
            pass # File doesn't exist on remote
            
        with open(local_path, 'rb') as f:
            ftp.storbinary(f"STOR {filename}", f)
            print(f"Uploaded: {filename}")
    except Exception as e:
        print(f"Error uploading {filename}: {e}")

def upload_dir(ftp, local_dir, remote_dir):
    try:
        ftp.mkd(remote_dir)
        print(f"Created directory: {remote_dir}")
    except:
        pass # Already exists
    
    print(f"Entering directory: {remote_dir}")
    ftp.cwd(remote_dir)
    
    print(f"Listing directory: {os.path.abspath(local_dir)}")
    items = os.listdir(local_dir)
    print(f"Items found in {local_dir}: {items}")
    for item in items:
        local_path = os.path.join(local_dir, item)
        if os.path.isfile(local_path):
            upload_file(ftp, local_path, item)
        elif os.path.isdir(local_path):
            upload_dir(ftp, local_path, item)
            ftp.cwd("..")

if __name__ == "__main__":
    try:
        print(f"Connecting to {FTP_HOST}...")
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        
        try:
            ftp.mkd(REMOTE_TARGET)
        except:
            pass
            
        print(f"Targeting {REMOTE_TARGET}...")
        ftp.cwd(REMOTE_TARGET)
        
        for filename in FILES_TO_UPLOAD:
            if os.path.exists(filename):
                upload_file(ftp, filename, filename)
            else:
                print(f"Warning: {filename} not found.")
                
        for dirname in DIRS_TO_UPLOAD:
            if os.path.exists(dirname):
                upload_dir(ftp, dirname, dirname)
                ftp.cwd("..")
            else:
                print(f"Warning: {dirname} not found.")
        
        ftp.quit()
        print("\nUpload complete!")
        print(f"View live at: https://voxcuriosa.no/roma/")
    except Exception as e:
        print(f"Error: {e}")
