# Set base image
FROM python:3.11

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY /app/requirements.txt .

# Install any dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the content of the local src directory to the working directory
COPY /app .

# By default, listen on port 5000
ENV FLASK_DEBUG=1
EXPOSE 5000

# Set the command to run the application
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
# CMD ["gunicorn", "app:app"]