#!/usr/bin/env perl
use strict;
use warnings;
use cPanel::PublicAPI;
use JSON;
use Carp;
use Email::Sender::Simple qw(sendmail);
use Email::Sender;
use Email::Sender::Transport::SMTP;
use Readonly;
use Data::Dumper;
use feature 'state';

Readonly my $DEFAULT_QUOTA => 250;

my %new_sites = (
        'friedrichshafen' => {
                'external_email' => 'n.mueller@zeppelin-university.net',
                'type'           => 'forwarder',
                'bosses'         => {
                        'nicolai' => {
                                'external_email'       => 'n.mueller@zeppelin-university.net',
                                'type'                 => 'mailbox',
                                'city_email_recipient' => 1,
                        },
                  }    # end 'bosses' ,
        },
 'liberia' => {
                'external_email' => 'benmorgan@pobox.com',
                'type'           => 'forwarder',
                'bosses'         => {
                        'ben' => {
                                'external_email'       => 'benmorgan@pobox.com',
                                'type'                 => 'forwarder',
                                'city_email_recipient' => 1,
                        },
                  }    # end 'bosses' ,
        },

        'eastbay' => {
                'external_email' => 'karnesky@gmail.com',
                'type'           => 'mailbox',
                'bosses'         => {
                        'rick' => {
                                'external_email'       => 'karnesky@gmail.com',
                                'type'                 => 'mailbox',
                                'city_email_recipient' => 1,
                        },
                        'ian' => {
                                'external_email'       => 'jungziege@gmail.com',
                                'type'                 => 'forwarder',
                                'city_email_recipient' => 1,
                        },
                        'aaron' => {
                                'external_email'       => 'aculich@eecs.berkeley.edu',
                                'type'                 => 'forwarder',
                                'city_email_recipient' => 1,
                        },
                  }    # end 'bosses' ,
        }
);

foreach my $city ( keys %new_sites ) {


	# Create Boss Email addresses
	my %bosses = %{ $new_sites{$city}->{bosses} };
	my @city_targets;

	foreach my $new_boss_email ( keys %bosses ) {
		my $new_boss = $bosses{$new_boss_email};
		create_email( $new_boss_email, $new_boss->{type},
			[ $new_boss->{external_email} ] );
			
		if($new_boss->{city_email_recipient}) {
			push @city_targets, $new_boss_email;
		}
	}
	
	# Create City Email
	create_email( $city, $new_sites{$city}->{type}, [ map {"$_\@nerdnite.com"} @city_targets] );
	
	# Add bosses to bosses@nerdnite.com
	create_email('bosses','forwarder', [map {$_.'@nerdnite.com'} keys %bosses])
}

sub create_email {
	my $nn_email        = shift;
	my $email_type      = shift;
	my $external_emails = shift;
	
	my $message = '';
	my @notifees;

	if ( $email_type eq 'forwarder' ) {
		create_forwarders( $nn_email, $external_emails );
		
		@notifees = ("$nn_email\@nerdnite.com");
		$message = <<"END_OF_MESSAGE";			
Hello,

We have just created (or updated) a forwarder from $nn_email\@nerdnite.com to this email address.

Dan
END_OF_MESSAGE
	}
	elsif ( $email_type eq 'mailbox' ) {
		my $password = create_mailbox($nn_email);
		# Send an email to the external address with username and password details.
		@notifees = @{$external_emails};
		$message = <<"END_OF_MESSAGE";			
Hello,

We have just created a mailbox for $nn_email\@nerdnite.com.

You can access this mailbox via the web at http://nerdnite.com/webmail
Username: $nn_email+nerdnite.com
Password: $password

Dan
END_OF_MESSAGE
	
	}
	else {
		carp "Failed to create account for $nn_email\@nerdnite.com\n";
	}
	print STDERR "Sending emails to @notifees\n";
	foreach my $external_email (@notifees) {
		my $transport = Email::Sender::Transport::SMTP->new({
    		host	=> 'lizziebracken.com',
    		port 	=> 465,
    		ssl		=> 1,
    		sasl_username	=> 'dan+nerdnite.com',
    		sasl_password	=> 's4tgd1tw',
    		
  		});
  		my $email = Email::Simple->create(
  			header 	=> [
			 	To		=> $external_email,
			 	From	=> 'web@nerdnite.com',
			 	Subject	=> 'New Nerd Nite Mailbox',
			 ],
			 body	=> $message,
			);
			sendmail($email, { transport => $transport}) or croak  "Mail fail";
		}
}

sub create_mailbox {
	my $email    = shift;
	my $password = create_random_password();

	my $params = {
		domain   => 'nerdnite.com',
		email    => $email,
		password => $password,
		quota    => $DEFAULT_QUOTA
	};
	my $result = send_cpanel_request( 'Email', 'addpop', $params );
	print STDERR Dumper($result);
	
	return $password;
}

sub create_forwarders {
	my $email   = shift;
	my $targets = shift;

	my $params = {
		domain => 'nerdnite.com',
		email  => $email,
	};
	$params->{fwdopt} = 'fwd';

	foreach my $target ( @{$targets} ) {
		$params->{fwdemail} = $target;
		my $result = send_cpanel_request( 'Email', 'addforward', $params );
		print STDERR Dumper($result);
	}
}

sub send_cpanel_request {
	state $cp = cPanel::PublicAPI->new(
		'user'   => 'nerdnite',
		'pass'   => 's4tgd1tw',
		'host'   => 'lizziebracken.com',
		'usessl' => 1,
		'debug'		=> 1,
	) || croak "Could not create cPanel connection: $!";
	state $json = JSON->new->allow_nonref;

	my $module   = shift;
	my $function = shift;
	my $params   = shift;

	my $result = $cp->cpanel_api2_request(
		'cpanel',
		{
			'module' => $module,
			'func'   => $function,
		},
		$params, 'json'
	);
	print STDERR Dumper($result);
	return $json->decode($result)->{cpanelresult};
}

srand;

sub create_random_password {
	my @password_symbols = ( 0 .. 9, 'a' .. 'z' );
	my $length = shift || 8;
	my $password = '';
	foreach my $sym_num (0..$length) {
		$password .= $password_symbols[ rand @password_symbols ];
	}

	return $password;
}

