from typing import Optional, Union

import psycopg2


class POSTGRE_DB_INSERT:

    def __init__(self):
        self.conn = None
        self.cursor = None

    def schedule(
        self,
        event_name: Union[str, None] = None,
        event_value: Optional[Union[str, None]] = None,
        host: Optional[Union[str, None]] = None,
        port: Optional[Union[int, None]] = None,
        user: Optional[Union[str, None]] = None,
        password: Optional[Union[str, None]] = None,
        dbname: Optional[Union[str, None]] = None,
        schema: Optional[Union[str, None]] = None,
        table: Optional[Union[str, None]] = None,
        columns: Optional[Union[str, None]] = None,
        data: Optional[Union[str, None]] = None,
    ):
        if event_name not in ["INIT", "RUN"]:
            raise ValueError("Invalid event name.")

        if event_name == "INIT":

            try:
                self.conn = psycopg2.connect(
                    dbname=dbname,
                    user=user,
                    password=password,
                    host=host,
                    port=port,
                )
                self.cursor = self.conn.cursor()

                return [event_value, None, True]

            except psycopg2.OperationalError as err:
                self.conn = None
                print(err)

                return [event_value, None, False]

        elif event_name == "RUN":

            if self.conn is not None:
                try:
                    if len(data) > 0:

                        self.cursor.execute(f'SET search_path TO "{schema}"')
                        self.cursor.execute(f"INSERT INTO {table}({columns}) VALUES {data}")

                        self.conn.commit()

                        return [None, event_value, True]

                    return [None, event_value, True]

                except Exception as err:
                    self.conn.rollback()  # rollback to previous state
                    print(err)

                    return [None, event_value, False]

            else:
                print("No connection to PostgreSQL DB.")
                return [event_value, None, False]
