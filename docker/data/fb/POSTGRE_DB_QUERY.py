import psycopg2
from psycopg2 import OperationalError


class POSTGRE_DB_QUERY:

    def __init__(self):
        self.conn = None
        self.cursor = None

    def schedule(
        self,
        event_name,
        event_value,
        host,
        port,
        user,
        password,
        dbname,
        filepath,
    ):

        if event_name == "INIT":
            # catch exception for invalid SQL connection
            try:
                # declare a new PostgreSQL connection object
                self.conn = psycopg2.connect(
                    dbname=dbname,
                    user=user,
                    password=password,
                    host=host,
                    port=port,
                )
                self.cursor = self.conn.cursor()

            except OperationalError as err:
                print(err)
                # set the connection to 'None' in case of error
                self.conn = None

            finally:
                return [event_value, None, None]

        elif event_name == "RUN":
            result = None
            if self.conn is not None:

                # catch exception for invalid SQL statement
                result = None
                try:
                    self.cursor.execute(open(filepath, "r").read())
                    self.conn.commit()
                    result = self.cursor.fetchall()

                except Exception as err:
                    print(err)
                    # rollback the previous transaction before starting another
                    self.conn.rollback()
                    result = str(err)

                finally:
                    return [None, event_value, result]
            else:
                result = "No active connection to PostgreSQL DB."
                print(result)
                return [event_value, None, result]
